import json

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from supabase.client import create_client, Client
from django.conf import settings


class AuthViewSet(viewsets.ViewSet):
    """
    API endpoint for Supabase authentication.
    Handles signup, login, and OTP verification.
    """

    permission_classes = [AllowAny]

    def get_supabase_client(self) -> Client:
        """Get Supabase client"""
        return create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_KEY
        )

    @action(detail=False, methods=['post'])
    def signup(self, request):
        """
        Sign up new guest with email and password
        """
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            supabase = self.get_supabase_client()

            res = supabase.auth.sign_up({
                "email": email,
                "password": password
            })
        if not res.user:
            return Response(
                {"error": "No user returned from Supabase. Please check your Supabase configuration."},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response({
            "user_id": res.user.id,
            "email": res.user.email,
            "message": "Sign up successful. Please check your email for verification."
        }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def login(self, request):

        import json

        # Handle DRF Browsable API JSON submissions
        if request.data.get("_content"):
            data = json.loads(request.data.get("_content"))
            email = data.get("email")
            password = data.get("password")
        else:
            email = request.data.get("email")
            password = request.data.get("password")

        if not email or not password:
            return Response(
                {"error": "Email and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            supabase = self.get_supabase_client()

            res = supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })

            return Response({
                "access_token": res.session.access_token,
                "refresh_token": res.session.refresh_token,
                "user": {
                    "id": res.user.id,
                    "email": res.user.email
                }
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
    

    @action(detail=False, methods=['post'])
    def send_otp(self, request):
        """
        Send OTP for password-less login
        """
        email = request.data.get('email')

        if not email:
            return Response(
                {'error': 'Email is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            supabase = self.get_supabase_client()

            supabase.auth.sign_in_with_otp({
                "email": email
            })

            return Response({
                "message": "OTP sent to your email",
                "email": email
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def verify_otp(self, request):
        """
        Verify OTP and get session
        """
        email = request.data.get('email')
        token = request.data.get('token')

        if not email or not token:
            return Response(
                {'error': 'Email and token are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            supabase = self.get_supabase_client()

            res = supabase.auth.verify_otp({
                "email": email,
                "token": token,
                "type": "email"
            })

            return Response({
                "access_token": res.session.access_token,
                "refresh_token": res.session.refresh_token,
                "user": {
                    "id": res.user.id,
                    "email": res.user.email
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

    @action(detail=False, methods=['post'])
    def refresh_token(self, request):
        """
        Refresh access token
        """
        refresh_token = request.data.get('refresh_token')

        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            supabase = self.get_supabase_client()

            res = supabase.auth.refresh_session(refresh_token)

            return Response({
                "access_token": res.session.access_token,
                "refresh_token": res.session.refresh_token
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
