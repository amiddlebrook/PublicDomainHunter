"""
Authentication API endpoints.

Handles user registration, login, logout, and password management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Any, Dict
import logging

from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse, Token, UserInDB
from app.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_current_active_superuser,
    get_password_hash,
    check_password_strength,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    generate_password_reset_token,
    verify_password_reset_token
)

logger = logging.getLogger(__name__)

router = APIRouter()

class LoginRequest(BaseModel):
    """Login request model."""
    username: str
    password: str

class PasswordResetRequest(BaseModel):
    """Password reset request model."""
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation model."""
    token: str
    new_password: str

class PasswordChangeRequest(BaseModel):
    """Password change request model."""
    current_password: str
    new_password: str

class OAuthLoginRequest(BaseModel):
    """OAuth login/registration request model."""
    provider: str
    provider_user_id: str
    email: EmailStr
    name: str

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Creates a new user account with the provided information.
    """
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

    # Validate password strength
    is_valid_password, password_message = check_password_strength(user_data.password)
    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=password_message
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        is_active=True,
        is_superuser=False
    )

    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except Exception as e:
        db.rollback()
        logger.error(f"Database error during user registration: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account. Please try again later."
        )

    logger.info(f"New user registered: {db_user.username}")
    return db_user

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.

    OAuth2 compatible token login endpoint.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    logger.info(f"User logged in: {user.username}")
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/oauth", response_model=UserResponse)
async def oauth_login(
    oauth_data: OAuthLoginRequest,
    db: Session = Depends(get_db)
):
    """
    OAuth login/registration endpoint.

    Creates a new user or returns existing user based on OAuth provider data.
    """
    # Check if user exists by email
    user = db.query(User).filter(User.email == oauth_data.email).first()

    if user:
        # User exists, update their information if needed
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive"
            )

        # Update full_name if it's different
        if oauth_data.name and user.full_name != oauth_data.name:
            user.full_name = oauth_data.name
            db.commit()
            db.refresh(user)

        logger.info(f"OAuth user logged in: {user.username} via {oauth_data.provider}")
        return user
    else:
        # Create new user from OAuth data
        # Generate username from email or name
        base_username = oauth_data.email.split('@')[0].lower()
        username = base_username
        counter = 1

        # Ensure username is unique
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}{counter}"
            counter += 1

        # Create user without password (OAuth users don't need one)
        db_user = User(
            email=oauth_data.email,
            username=username,
            hashed_password="",  # No password for OAuth users
            full_name=oauth_data.name,
            is_active=True,
            is_superuser=False
        )

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        logger.info(f"New OAuth user registered: {db_user.username} via {oauth_data.provider}")
        return db_user

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_active_user)):
    """
    Logout current user.

    In a stateless JWT system, logout is handled client-side by removing the token.
    This endpoint can be used for logging purposes.
    """
    logger.info(f"User logged out: {current_user.username}")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information.

    Returns the current authenticated user's information.
    """
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update current user profile.

    Allows users to update their profile information.
    """
    # Check if email is already taken by another user
    existing_user = db.query(User).filter(
        User.email == user_update.email,
        User.id != current_user.id
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username is already taken by another user
    existing_user = db.query(User).filter(
        User.username == user_update.username,
        User.id != current_user.id
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Update user information
    for field, value in user_update.dict().items():
        if field != 'password':  # Don't update password here
            setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)

    logger.info(f"User profile updated: {current_user.username}")
    return current_user

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Change user password.

    Allows authenticated users to change their password.
    """
    from app.auth import verify_password

    # Verify current password
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )

    # Validate new password strength
    is_valid_password, password_message = check_password_strength(password_data.new_password)
    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=password_message
        )

    # Update password
    current_user.hashed_password = get_password_hash(password_data.new_password)
    db.commit()

    logger.info(f"Password changed for user: {current_user.username}")
    return {"message": "Password updated successfully"}

@router.post("/forgot-password")
async def forgot_password(
    request: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Request password reset.

    Sends a password reset email to the user.
    """
    user = db.query(User).filter(User.email == request.email).first()

    if user:
        reset_token = generate_password_reset_token(request.email)
        # TODO: Send email with reset token
        # background_tasks.add_task(send_password_reset_email, request.email, reset_token)
        logger.info(f"Password reset requested for: {request.email}")

    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/reset-password")
async def reset_password(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """
    Reset password using token.

    Allows users to reset their password using a valid reset token.
    """
    email = verify_password_reset_token(reset_data.token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Validate new password strength
    is_valid_password, password_message = check_password_strength(reset_data.new_password)
    if not is_valid_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=password_message
        )

    # Find and update user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.hashed_password = get_password_hash(reset_data.new_password)
    db.commit()

    logger.info(f"Password reset completed for: {email}")
    return {"message": "Password has been reset successfully"}

@router.get("/users", response_model=list[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
):
    """
    Get all users (admin only).

    Returns a paginated list of all users.
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
):
    """
    Get user by ID (admin only).

    Returns user information for the specified user ID.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    is_active: bool,
    current_user: User = Depends(get_current_active_superuser),
    db: Session = Depends(get_db)
):
    """
    Update user active status (admin only).

    Activates or deactivates a user account.
    """
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify your own status"
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.is_active = is_active
    db.commit()

    logger.info(f"User {user_id} {'activated' if is_active else 'deactivated'} by {current_user.username}")
    return {"message": f"User {'activated' if is_active else 'deactivated'}"}

# Import required modules
from datetime import timedelta
