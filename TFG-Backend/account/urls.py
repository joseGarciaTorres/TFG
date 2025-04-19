from django.urls import path, include
from account.views import (
    UserRegistrationView,UserLoginView,UserProfileView,
    UserChangePasswordView,SendPasswordResetEmailView,
    UserPasswordResetView, SendFriendRequestView, 
    AcceptFriendRequestView, CancelFriendRequestView,
    DeleteFriendRequestView, RemoveFriendView, FriendRequestListView, 
    UserSearchView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/',UserRegistrationView.as_view(),name="register"),
    path('login/',UserLoginView.as_view(),name="login"),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('changepassword/', UserChangePasswordView.as_view(), name='changepassword'),
    path('send-reset-password-email/', SendPasswordResetEmailView.as_view(), name='send-reset-password-email'),
    path('reset-password/<uid>/<token>/', UserPasswordResetView.as_view(), name='reset-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('friend-request/send/', SendFriendRequestView.as_view(), name='send_friend_request'),
    path('friend-request/accept/', AcceptFriendRequestView.as_view(), name='accept_friend_request'),
    path('friend-request/cancel/', CancelFriendRequestView.as_view(), name='cancel_friend_request'),
    path('friend-request/delete/', DeleteFriendRequestView.as_view(), name='delete_friend_request'),
    path('friend/remove/', RemoveFriendView.as_view(), name='remove_friend'),
    path('friend-request/list/', FriendRequestListView.as_view(), name='list_friend_requests'),
    path('profile/search/', UserSearchView.as_view(), name='buscar-usuarios'),

]