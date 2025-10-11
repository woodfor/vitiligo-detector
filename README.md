# Vitiligo Detector App 👋

This is a [React Native](https://reactnative.dev) app built with [Expo](https://expo.dev) for detecting vitiligo using computer vision and frame processing.

## Features

- **Camera Integration**: Uses `react-native-vision-camera` for real-time camera access
- **Frame Processing**: Implements frame processors for real-time image analysis
- **Vitiligo Detection**: Ready for implementing vitiligo detection algorithms
- **Cross-platform**: Works on iOS and Android

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Camera Usage

The app includes a camera button that allows you to:

1. **Start Camera**: Tap "Start Camera" to begin real-time camera preview
2. **Frame Processing**: The camera automatically processes each frame for vitiligo detection
3. **Stop Camera**: Tap "Stop Camera" to return to the main screen

### Frame Processor Implementation

The frame processor is set up in `app/index.tsx` and ready for vitiligo detection logic:

```typescript
const frameProcessor = useFrameProcessor((frame) => {
  'worklet';

  // TODO: Add your vitiligo detection algorithm here
  // Access frame properties: frame.width, frame.height, frame.timestamp

  // Send results to JS thread
  runOnJS(processFrameData)({
    hasVitiligo: false, // Your detection result
    confidence: 0.0, // Your confidence score
  });
}, []);
```

### Next Steps

To implement vitiligo detection:

1. Add a computer vision library (e.g., TensorFlow Lite, OpenCV)
2. Implement image preprocessing in the frame processor
3. Add your detection algorithm
4. Update the UI to show detection results

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
