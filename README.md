# CampuHead #

Android Build Method
npm install or yarn install

and then you have to make index.android.bundle
react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

```bash
react-native run-android
```
