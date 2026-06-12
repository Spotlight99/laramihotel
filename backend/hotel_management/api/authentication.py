from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User
import jwt
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseAuthentication(TokenAuthentication):
    """
    Supabase JWT authentication.
    """
    keyword = 'Bearer'
    
    def authenticate(self, request):
        auth = self._get_authorization_header(request)
        
        if not auth:
            return None
        
        if len(auth) == 1:
            msg = 'Invalid token header. No credentials provided.'
            raise AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = 'Invalid token header. Token string should not contain spaces.'
            raise AuthenticationFailed(msg)
        
        try:
            token = auth[1].decode()
        except UnicodeError:
            msg = 'Invalid token header. Token string should not contain invalid characters.'
            raise AuthenticationFailed(msg)
        
        return self.authenticate_credentials(token)
    
    def authenticate_credentials(self, key):
        try:
            # Decode JWT from Supabase
            payload = jwt.decode(
                key,
                settings.SUPABASE_KEY,
                algorithms=['HS256'],
                options={"verify_signature": False}  # For development, set to True in production
            )
            
            user_id = payload.get('sub')
            email = payload.get('email')
            
            if not user_id:
                raise AuthenticationFailed('Invalid token')
            
            # Create or get user
            user, created = User.objects.get_or_create(
                username=user_id,
                defaults={'email': email}
            )
            
            return (user, key)
        
        except jwt.DecodeError:
            raise AuthenticationFailed('Invalid token')
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired')
        except AuthenticationFailed:
            raise
        except Exception as e:
            logger.error(f'Authentication failed: {str(e)}')
            raise AuthenticationFailed(f'Authentication failed: {str(e)}')
    
    @staticmethod
    def _get_authorization_header(request):
        """
        Return request's 'Authorization:' header, as a two-tuple of
        (auth_type, auth_string).  Used by TokenAuthentication.
        """
        auth = request.META.get('HTTP_AUTHORIZATION', b'')
        if isinstance(auth, str):
            # Work around django test client oddness
            auth = auth.encode(encoding='utf-8')
        return auth.split()
