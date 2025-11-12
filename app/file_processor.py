"""
File processing service for EPUB and PDF files.

Handles file uploads, metadata extraction, content analysis,
and storage management for public domain works.
"""

import os
import logging
import tempfile
import shutil
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from datetime import datetime
import uuid
import mimetypes

# File processing libraries
try:
    import ebooklib
    from ebooklib import epub
    import PyPDF2
    from bs4 import BeautifulSoup
    import chardet
    HAS_FILE_PROCESSING = True
except ImportError:
    HAS_FILE_PROCESSING = False
    logging.warning("File processing libraries not available. Install with: pip install ebooklib PyPDF2 beautifulsoup4 chardet")

logger = logging.getLogger(__name__)

class FileProcessingError(Exception):
    """Custom exception for file processing errors."""
    pass

class FileProcessor:
    """
    Service for processing EPUB and PDF files.

    Handles file validation, metadata extraction, content parsing,
    and storage management.
    """

    def __init__(self, upload_dir: str = "uploads"):
        """
        Initialize file processor.

        Args:
            upload_dir: Directory for storing uploaded files
        """
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)

        # Supported file types
        self.supported_extensions = {
            '.epub': 'application/epub+zip',
            '.pdf': 'application/pdf'
        }

        self.supported_mimetypes = list(self.supported_extensions.values())

        # File size limits (in bytes)
        self.max_file_size = 50 * 1024 * 1024  # 50MB
        self.chunk_size = 8192  # 8KB chunks for processing

        logger.info("File processor initialized")

    def is_available(self) -> bool:
        """Check if file processing capabilities are available."""
        return HAS_FILE_PROCESSING

    def validate_file(self, file_path: Path, filename: str) -> Tuple[bool, str]:
        """
        Validate uploaded file.

        Args:
            file_path: Path to uploaded file
            filename: Original filename

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not file_path.exists():
            return False, "File does not exist"

        # Check file size
        file_size = file_path.stat().st_size
        if file_size > self.max_file_size:
            return False, f"File too large. Maximum size: {self.max_file_size / (1024 * 1024):.1f}MB"

        if file_size == 0:
            return False, "File is empty"

        # Check file extension
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.supported_extensions:
            return False, f"Unsupported file type. Supported: {', '.join(self.supported_extensions.keys())}"

        # Check MIME type
        mimetype, _ = mimetypes.guess_type(filename)
        if mimetype not in self.supported_mimetypes:
            return False, f"Invalid file type detected: {mimetype}"

        return True, ""

    def process_file(self, file_path: Path, filename: str, user_id: int) -> Dict[str, Any]:
        """
        Process uploaded file and extract metadata.

        Args:
            file_path: Path to uploaded file
            filename: Original filename
            user_id: User ID who uploaded the file

        Returns:
            Dictionary containing extracted metadata and content

        Raises:
            FileProcessingError: If processing fails
        """
        if not self.is_available():
            raise FileProcessingError("File processing libraries not available")

        # Validate file
        is_valid, error_msg = self.validate_file(file_path, filename)
        if not is_valid:
            raise FileProcessingError(error_msg)

        file_ext = Path(filename).suffix.lower()

        try:
            if file_ext == '.epub':
                return self._process_epub(file_path, filename, user_id)
            elif file_ext == '.pdf':
                return self._process_pdf(file_path, filename, user_id)
            else:
                raise FileProcessingError(f"Unsupported file type: {file_ext}")

        except Exception as e:
            logger.error(f"Error processing file {filename}: {e}")
            raise FileProcessingError(f"Failed to process file: {str(e)}")

    def _process_epub(self, file_path: Path, filename: str, user_id: int) -> Dict[str, Any]:
        """
        Process EPUB file and extract metadata.

        Args:
            file_path: Path to EPUB file
            filename: Original filename
            user_id: User ID

        Returns:
            Extracted metadata and content
        """
        try:
            # Read EPUB file
            book = epub.read_epub(str(file_path))

            # Extract basic metadata
            metadata = {
                'title': book.get_metadata('DC', 'title'),
                'creator': book.get_metadata('DC', 'creator'),
                'language': book.get_metadata('DC', 'language'),
                'publisher': book.get_metadata('DC', 'publisher'),
                'date': book.get_metadata('DC', 'date'),
                'identifier': book.get_metadata('DC', 'identifier'),
                'description': book.get_metadata('DC', 'description'),
                'subject': book.get_metadata('DC', 'subject'),
                'rights': book.get_metadata('DC', 'rights'),
            }

            # Clean up metadata (take first value if multiple)
            clean_metadata = {}
            for key, values in metadata.items():
                if values:
                    clean_metadata[key] = str(values[0])
                else:
                    clean_metadata[key] = None

            # Extract text content
            text_content = []
            for item in book.get_items():
                if item.get_type() == ebooklib.ITEM_DOCUMENT:
                    try:
                        content = item.get_content().decode('utf-8')
                        soup = BeautifulSoup(content, 'html.parser')
                        text = soup.get_text()
                        text_content.append(text)
                    except Exception as e:
                        logger.warning(f"Error extracting content from EPUB section: {e}")

            full_text = '\n\n'.join(text_content)

            # Generate file hash for duplicate detection
            file_hash = self._generate_file_hash(file_path)

            # Get file statistics
            file_stats = self._get_file_stats(file_path)

            return {
                'file_info': {
                    'original_filename': filename,
                    'file_path': str(file_path),
                    'file_size': file_stats['size'],
                    'file_hash': file_hash,
                    'upload_timestamp': datetime.utcnow().isoformat(),
                    'user_id': user_id
                },
                'metadata': clean_metadata,
                'content': {
                    'full_text': full_text[:50000],  # Limit text for performance
                    'text_length': len(full_text),
                    'chapter_count': len([item for item in book.get_items() if item.get_type() == ebooklib.ITEM_DOCUMENT]),
                    'has_images': len([item for item in book.get_items() if item.get_type() == ebooklib.ITEM_IMAGE]) > 0,
                    'has_audio': len([item for item in book.get_items() if item.get_type() == ebooklib.ITEM_AUDIO]) > 0
                },
                'analysis': self._analyze_content(full_text, clean_metadata),
                'file_type': 'epub'
            }

        except Exception as e:
            logger.error(f"Error processing EPUB file: {e}")
            raise FileProcessingError(f"EPUB processing failed: {str(e)}")

    def _process_pdf(self, file_path: Path, filename: str, user_id: int) -> Dict[str, Any]:
        """
        Process PDF file and extract metadata.

        Args:
            file_path: Path to PDF file
            filename: Original filename
            user_id: User ID

        Returns:
            Extracted metadata and content
        """
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)

                # Extract metadata
                metadata = pdf_reader.metadata or {}

                # Extract text content
                text_content = []
                for page_num in range(len(pdf_reader.pages)):
                    try:
                        page = pdf_reader.pages[page_num]
                        text = page.extract_text()
                        text_content.append(text)
                    except Exception as e:
                        logger.warning(f"Error extracting text from PDF page {page_num}: {e}")

                full_text = '\n\n'.join(text_content)

                # Generate file hash
                file_hash = self._generate_file_hash(file_path)

                # Get file statistics
                file_stats = self._get_file_stats(file_path)

                return {
                    'file_info': {
                        'original_filename': filename,
                        'file_path': str(file_path),
                        'file_size': file_stats['size'],
                        'file_hash': file_hash,
                        'upload_timestamp': datetime.utcnow().isoformat(),
                        'user_id': user_id
                    },
                    'metadata': {
                        'title': metadata.get('/Title', ''),
                        'author': metadata.get('/Author', ''),
                        'creator': metadata.get('/Creator', ''),
                        'producer': metadata.get('/Producer', ''),
                        'creation_date': metadata.get('/CreationDate', ''),
                        'modification_date': metadata.get('/ModDate', ''),
                        'pages': len(pdf_reader.pages),
                        'encrypted': pdf_reader.is_encrypted
                    },
                    'content': {
                        'full_text': full_text[:50000],  # Limit text for performance
                        'text_length': len(full_text),
                        'page_count': len(pdf_reader.pages),
                        'has_bookmarks': len(pdf_reader.outline) > 0 if pdf_reader.outline else False,
                        'has_annotations': any(page.annotations for page in pdf_reader.pages if hasattr(page, 'annotations'))
                    },
                    'analysis': self._analyze_content(full_text, metadata),
                    'file_type': 'pdf'
                }

        except Exception as e:
            logger.error(f"Error processing PDF file: {e}")
            raise FileProcessingError(f"PDF processing failed: {str(e)}")

    def _generate_file_hash(self, file_path: Path) -> str:
        """
        Generate SHA-256 hash of file for duplicate detection.

        Args:
            file_path: Path to file

        Returns:
            Hexadecimal hash string
        """
        import hashlib

        hash_sha256 = hashlib.sha256()
        with open(file_path, 'rb') as f:
            for chunk in iter(lambda: f.read(self.chunk_size), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()

    def _get_file_stats(self, file_path: Path) -> Dict[str, Any]:
        """
        Get file statistics.

        Args:
            file_path: Path to file

        Returns:
            Dictionary with file statistics
        """
        stat = file_path.stat()
        return {
            'size': stat.st_size,
            'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
            'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
        }

    def _analyze_content(self, text: str, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze extracted content for insights.

        Args:
            text: Extracted text content
            metadata: File metadata

        Returns:
            Analysis results
        """
        # Basic text analysis
        words = text.split()
        sentences = text.split('.')

        # Language detection (basic)
        if metadata.get('language'):
            detected_language = metadata['language'][0] if isinstance(metadata['language'], list) else metadata['language']
        else:
            # Simple language detection based on common words
            english_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of'}
            french_words = {'le', 'la', 'les', 'et', 'ou', 'mais', 'dans', 'sur', 'à', 'pour', 'de'}
            german_words = {'der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'an', 'auf', 'zu', 'für', 'von'}

            text_lower = text.lower()
            english_count = sum(1 for word in english_words if word in text_lower)
            french_count = sum(1 for word in french_words if word in text_lower)
            german_count = sum(1 for word in german_words if word in text_lower)

            if english_count > french_count and english_count > german_count:
                detected_language = 'en'
            elif french_count > german_count:
                detected_language = 'fr'
            else:
                detected_language = 'de'

        # Content classification
        content_type = self._classify_content(text)

        # Readability metrics (simplified)
        avg_words_per_sentence = len(words) / max(len(sentences), 1)
        avg_sentence_length = len(text) / max(len(sentences), 1)

        return {
            'word_count': len(words),
            'sentence_count': len(sentences),
            'character_count': len(text),
            'detected_language': detected_language,
            'content_type': content_type,
            'readability_metrics': {
                'avg_words_per_sentence': avg_words_per_sentence,
                'avg_sentence_length': avg_sentence_length,
                'estimated_reading_time_minutes': len(words) // 200  # Assuming 200 WPM
            },
            'has_chapters': '\nChapter' in text or '\nCHAPTER' in text,
            'has_table_of_contents': 'Table of Contents' in text or 'TABLE OF CONTENTS' in text,
            'has_index': 'Index' in text or 'INDEX' in text,
            'publication_year': self._extract_publication_year(text, metadata)
        }

    def _classify_content(self, text: str) -> str:
        """
        Classify content type based on text analysis.

        Args:
            text: Text content to analyze

        Returns:
            Content classification
        """
        text_lower = text.lower()

        # Fiction indicators
        fiction_keywords = ['chapter', 'story', 'novel', 'character', 'plot', 'fiction']
        fiction_score = sum(1 for keyword in fiction_keywords if keyword in text_lower)

        # Non-fiction indicators
        nonfiction_keywords = ['research', 'study', 'analysis', 'data', 'methodology', 'conclusion']
        nonfiction_score = sum(1 for keyword in nonfiction_keywords if keyword in text_lower)

        # Academic indicators
        academic_keywords = ['abstract', 'introduction', 'methodology', 'results', 'discussion', 'references']
        academic_score = sum(1 for keyword in academic_keywords if keyword in text_lower)

        if academic_score > nonfiction_score and academic_score > fiction_score:
            return 'academic'
        elif nonfiction_score > fiction_score:
            return 'non_fiction'
        else:
            return 'fiction'

    def _extract_publication_year(self, text: str, metadata: Dict[str, Any]) -> Optional[int]:
        """
        Extract publication year from text and metadata.

        Args:
            text: Text content
            metadata: File metadata

        Returns:
            Publication year if found, None otherwise
        """
        import re

        # Try metadata first
        if metadata.get('date') or metadata.get('creation_date'):
            date_str = metadata.get('date', metadata.get('creation_date', ''))
            if isinstance(date_str, list):
                date_str = str(date_str[0])

            # Extract year from date string
            year_match = re.search(r'(\d{4})', str(date_str))
            if year_match:
                return int(year_match.group(1))

        # Try to find year in text
        year_pattern = r'\b(19|20)\d{2}\b'
        years = re.findall(year_pattern, text)

        if years:
            # Return the earliest year found (likely publication year)
            return min(map(int, years))

        return None

    def save_uploaded_file(self, file_content: bytes, filename: str, user_id: int) -> str:
        """
        Save uploaded file to storage.

        Args:
            file_content: File content as bytes
            filename: Original filename
            user_id: User ID

        Returns:
            File path where saved
        """
        # Generate unique filename
        file_ext = Path(filename).suffix.lower()
        unique_filename = f"{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}{file_ext}"
        file_path = self.upload_dir / unique_filename

        # Save file
        with open(file_path, 'wb') as f:
            f.write(file_content)

        logger.info(f"File saved: {file_path}")
        return str(file_path)

    def cleanup_old_files(self, days_old: int = 30):
        """
        Clean up old uploaded files.

        Args:
            days_old: Remove files older than this many days
        """
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        for file_path in self.upload_dir.glob('*'):
            if file_path.is_file():
                file_modified = datetime.fromtimestamp(file_path.stat().st_mtime)
                if file_modified < cutoff_date:
                    try:
                        file_path.unlink()
                        logger.info(f"Cleaned up old file: {file_path}")
                    except Exception as e:
                        logger.error(f"Error deleting file {file_path}: {e}")

# Global file processor instance
_file_processor = None

def get_file_processor() -> FileProcessor:
    """
    Get or create file processor instance.

    Returns:
        FileProcessor instance
    """
    global _file_processor
    if _file_processor is None:
        _file_processor = FileProcessor()
    return _file_processor
