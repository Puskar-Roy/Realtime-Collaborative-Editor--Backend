### Backend

```bash
 https://github.com/Puskar-Roy/Realtime-Collaborative-Editor--Backend
```


### Google OAuth Setup

You will need to sign up on Google cloud console to create the credentials.  
Here is a simple guide <https://developers.google.com/workspace/guides/create-credentials>  

Or, if you prefer a video tutorial  <https://youtu.be/OKMgyF5ezFs?si=BV25hSD1JhqSiL_3>

```txt
Remember to set the redirect URL to http://localhost:8080/auth/google/callback or the port you are running your server on.
```

### Add Env

```bash
GOOGLE_CLIENT_ID="yourgoogleclientid"
GOOGLE_CLIENT_SECRET="yoursgooglesecret"
GOOGLE_CALLBACK_URL= "http://localhost:8080/auth/google/callback"
CLIENT_URL="http://localhost:8080"

PORT=8080
MONGOURI=

JWT_SECRET="itsyourjwtsecrentusesomethingbigtoprotectyourjwtauthentication"
JWT_COOKIE_EXPIRES_IN="3d"
DEV_MODE=DEV
EMAIL
PASSWORD=
BACKENDURL=http://localhost:8080
FRONTENDURL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_URL= "http://localhost:8080/auth/google/callback"
CLIENT_URL="http://localhost:8080"
```
