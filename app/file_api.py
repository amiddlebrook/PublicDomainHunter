"""
File upload and processing API endpoints.

Handles file uploads, processing, and metadata extraction.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
import os
from pathlib import Path

from app.database import get_db
from app.models import Work
from app.auth import get_current_active_user
from app.file_processor import get_file_processor, FileProcessingError

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload and process a file (EPUB/PDF).

    Processes the uploaded file and extracts metadata and content.
    """
    file_processor = get_file_processor()

    try:
        # Validate file type
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file selected")

        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in ['.epub', '.pdf']:
            raise HTTPException(
                status_code=400,
                detail="Unsupported file type. Only EPUB and PDF files are supported."
            )

        # Read file content
        file_content = await file.read()

        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file")

        # Save file temporarily
        temp_file_path = file_processor.save_uploaded_file(file_content, file.filename, current_user.id)

        try:
            # Process file
            result = file_processor.process_file(Path(temp_file_path), file.filename, current_user.id)

            # Create work entry from extracted metadata
            work_data = {
                'title': result['metadata'].get('title', file.filename),
                'author': result['metadata'].get('creator', ''),
                'original_publication_year': result['analysis'].get('publication_year'),
                'public_domain_year': result['analysis'].get('publication_year'),
                'description': result['metadata'].get('description', ''),
                'media_type': 'book',  # Default to book
                'language': result['analysis'].get('detected_language', 'en'),
                'page_count': result['metadata'].get('pages'),
                'file_size': result['file_info']['file_size'],
                'metadata': {
                    **result['metadata'],
                    'file_hash': result['file_info']['file_hash'],
                    'processing_info': {
                        'word_count': result['analysis']['word_count'],
                        'content_type': result['analysis']['content_type'],
                        'has_chapters': result['analysis']['has_chapters'],
                        'estimated_reading_time': result['analysis']['readability_metrics']['estimated_reading_time_minutes']
                    }
                },
                'user_id': current_user.id
            }

            # Create work in database
            db_work = Work(**work_data)
            db.add(db_work)
            db.commit()
            db.refresh(db_work)

            # Clean up temporary file
            Path(temp_file_path).unlink()

            logger.info(f"File processed successfully: {file.filename} by user {current_user.username}")

            return {
                "message": "File processed successfully",
                "work_id": db_work.id,
                "work_title": db_work.title,
                "metadata": result
            }

        except FileProcessingError as e:
            # Clean up temporary file on error
            Path(temp_file_path).unlink(missing_ok=True)
            raise HTTPException(status_code=400, detail=str(e))
        except Exception as e:
            # Clean up temporary file on error
            Path(temp_file_path).unlink(missing_ok=True)
            logger.error(f"Unexpected error processing file: {e}")
            raise HTTPException(status_code=500, detail="File processing failed")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")

@router.get("/upload/status/{work_id}")
async def get_upload_status(
    work_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get upload processing status for a work.

    Args:
        work_id: Work ID to check
        current_user: Current authenticated user
        db: Database session

    Returns:
        Processing status information
    """
    work = db.query(Work).filter(
        Work.id == work_id,
        Work.user_id == current_user.id
    ).first()

    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    # Check if work has file processing metadata
    processing_info = work.metadata.get('processing_info', {}) if work.metadata else {}

    return {
        "work_id": work.id,
        "title": work.title,
        "status": "completed",
        "processing_info": processing_info,
        "created_at": work.created_at
    }

@router.post("/works/{work_id}/reprocess")
async def reprocess_work_file(
    work_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Reprocess an existing work's file.

    Args:
        work_id: Work ID to reprocess
        current_user: Current authenticated user
        db: Database session

    Returns:
        Reprocessing status
    """
    work = db.query(Work).filter(
        Work.id == work_id,
        Work.user_id == current_user.id
    ).first()

    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    # TODO: Implement file reprocessing
    # This would require storing the original file or re-uploading

    return {
        "message": "Reprocessing not yet implemented",
        "work_id": work_id
    }

@router.get("/file-types")
async def get_supported_file_types():
    """
    Get list of supported file types for upload.

    Returns:
        List of supported file types and their information
    """
    return {
        "supported_types": [
            {
                "extension": ".epub",
                "mime_type": "application/epub+zip",
                "description": "EPUB eBook files",
                "max_size_mb": 50
            },
            {
                "extension": ".pdf",
                "mime_type": "application/pdf",
                "description": "PDF documents",
                "max_size_mb": 50
            }
        ],
        "max_file_size_mb": 50,
        "requirements": [
            "Files must be valid EPUB or PDF format",
            "Maximum file size: 50MB",
            "Text content will be extracted for analysis",
            "Metadata will be automatically extracted"
        ]
    }

@router.delete("/works/{work_id}/file")
async def delete_work_file(
    work_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete the file associated with a work.

    Args:
        work_id: Work ID
        current_user: Current authenticated user
        db: Database session

    Returns:
        Deletion status
    """
    work = db.query(Work).filter(
        Work.id == work_id,
        Work.user_id == current_user.id
    ).first()

    if not work:
        raise HTTPException(status_code=404, detail="Work not found")

    # TODO: Implement file deletion from storage
    # This would require tracking file paths in the database

    return {
        "message": "File deletion not yet implemented",
        "work_id": work_id
    }
