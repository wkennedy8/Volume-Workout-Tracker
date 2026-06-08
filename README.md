# 💪 Volume - Workout Fitness Tracker

A comprehensive React Native fitness tracking application built with Expo, Firebase, and modern mobile UI/UX principles.

## 🌟 Features

### 📱 Core Functionality

#### Onboarding Experience
- **7-Step Guided Setup**
  - Personal information (Name, Email)
  - Fitness goal selection (Lose/Maintain/Gain weight)
  - Current weight entry
  - Workout program selection
  - Optional profile photo upload

#### Workout Management
- **Multiple Workout Programs**
  - Push/Pull/Legs (6-day split)
  - Full Body (3-day split)
  - Bro Split (5-day split)
- **Dynamic Workout Scheduling**
  - Day-based workout assignment
  - Rest day management
  - Workout rescheduling with cascade logic
  - Mark scheduled workouts as rest days
- **Session Tracking**
  - Start/Resume/Edit workout sessions
  - Exercise-by-exercise tracking
  - Set-by-set logging with weight and reps
  - Exercise notes and modifications
  - Rest timer with audio/haptic feedback
  - Session duration tracking
- **Workout Analytics**
  - Detailed session summaries
  - Total volume, sets, and reps
  - Best set tracking
  - Exercise completion percentage
  - Share workout results

#### Cardio Tracking
- **Type-Specific Logging**
  - Treadmill (duration, incline, speed)
  - Running (duration, distance, auto-calculated pace)
  - Walking (duration, distance)
  - Cycling (duration, distance)
  - Swimming (duration, distance)
  - Stairmaster (duration, level)
  - Other activities
- **Session Management**
  - Date-based tracking
  - Optional notes
  - View/edit/delete history
  - Analytics integration

#### Progress Tracking
- **Weight Monitoring**
  - Daily weight logging
  - Progress chart visualization
  - Target weight tracking
  - 30-day trend analysis
- **Analytics Dashboard**
  - Current streak calculation
  - Total workouts completed
  - Personal records (PRs)
  - Weight progress chart
  - Workout frequency stats
  - Volume trends

#### Profile & Settings
- **Personal Information**
  - Name and email
  - Phone number (non-editable)
  - Profile photo management
- **Health Details**
  - Current weight
  - Target weight
  - Age
- **Goals**
  - Fitness goal management
- **Preferences**
  - Weight units (lbs/kg)
  - Distance units (miles/km)
  - Notification settings
- **Workout Configuration**
  - Program selection
  - Schedule customization
- **Account Management**
  - Privacy settings
  - Sign out
  - Account deletion (admin only)

### 🎨 User Experience

- **Modern Dark Theme**
  - Lime green (#AFFF2B) accent color
  - High contrast design
  - Consistent typography
  - Smooth animations
- **Intuitive Navigation**
  - Tab-based navigation (Workout, Analytics, Profile)
  - Hub-style settings screens
  - Contextual back buttons
  - Modal workflows for data entry
- **Smart Interactions**
  - Swipe-to-delete functionality
  - Keyboard dismissal
  - Loading states
  - Error handling
  - Success feedback
- **Responsive Design**
  - ScrollView implementations
  - Keyboard avoidance
  - Safe area handling
  - Dynamic content sizing

## 🛠 Tech Stack

### Frontend
- **React Native** - Mobile framework
- **Expo** (~52.0.23) - Development platform
- **Expo Router** - File-based navigation
- **React Native Reanimated** - Smooth animations
- **React Native SVG** - Chart visualizations
- **Victory Native** - Data visualization

### Backend & Services
- **Firebase Authentication** - Phone-based auth
- **Cloud Firestore** - Real-time database
- **Firebase Storage** - Photo storage
- **Expo Image Picker** - Photo selection
- **Expo Sharing** - Workout result sharing

### State Management
- **React Context API**
  - AuthContext (user authentication)
  - OnboardingContext (setup flow)

### UI Components
- **Ionicons** - Icon system
- **@expo-google-fonts/quicksand** - Typography
- **expo-haptics** - Tactile feedback
- **expo-av** - Audio playback

## 📁 Project Structure

```
├── app/                         # Expo Router screens
│   ├── (tabs)/                  # Tab navigation
│   │   ├── index.jsx            # Home/Workout tab
│   │   ├── workout.jsx          # Workout for the day
│   │   └── analytics.jsx        # Analytics Dashboard
│   ├── login.jsx                # Authentication
│   ├── onboarding/              # Setup flow
│   │   └── index.jsx            # Multi-step wizard
│   ├── profile/                 # Settings screens
│   │   ├── edit.jsx             # Personal info
│   │   ├── plan.jsx             # Workout program
│   │   ├── health.jsx           # Health details
│   │   ├── goals.jsx            # Goals & macros
│   │   └── ...                  # Other settings
│   └── workout/                 # Workout screens
│       ├── session.jsx          # Active workout
│       └── details.jsx          # Session summary
├── components/                  # Reusable components
│   ├── onboarding/              # Setup steps
│   │   ├── NameStep.jsx
│   │   ├── EmailStep.jsx
│   │   ├── GoalStep.jsx
│   │   ├── WeightStep.jsx
│   │   ├── MacrosStep.jsx
│   │   ├── ProgramStep.jsx
│   │   └── PhotoStep.jsx
│   ├── CardioModal.jsx          # Cardio logging
│   └── ...                      # Other components
├── context/                     # React Context
│   ├── AuthContext.jsx          # Authentication
│   └── OnboardingContext.jsx    # Setup state
├── controllers/                 # Business logic
│   ├── sessionController.js     # Workout sessions
│   ├── profileController.js     # User profile
│   ├── plansController.js       # Workout plans
│   ├── cardioController.js      # Cardio tracking
│   └── rescheduleController.js  # Schedule logic
├── hooks/                       # Custom hooks
│   └── useTodayWorkoutSession.js
├── lib/                          
│   ├── firebase.js              # Firebase config
│   └── auth.js
├── utils/                       # Utilities
│   ├── workoutPlan.js           # Plan definitions
│   ├── dateUtils.js             # Date helpers
│   └── weightUtils.js           # Unit conversions
└── constants/                   # App constants
    └── fonts.js                 # Typography
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd fitness-tracker
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Set up Firebase**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Authentication (Phone provider)
   - Create a Firestore database
   - Enable Firebase Storage
   - Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Update `lib/firebase.js` with your config

4. **Configure Firestore Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{subcollection=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

5. **Start the development server**
```bash
npx expo start
```

6. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app for physical device

## 📊 Database Structure

### Firestore Collections

```
users/{uid}
├── profile/{main}
│   ├── goal: "lose" | "maintain" | "gain"
│   ├── currentWeight: number
│   ├── targetWeight: number
│   ├── protein: number
│   ├── carbs: number
│   ├── fats: number
│   ├── profilePhotoUri: string
│   └── onboardingCompleted: boolean
├── settings/{userSettings}
│   ├── name: string
│   ├── email: string
│   └── phone: string
├── settings/{workoutPlan}
│   ├── selectedPlanId: string
│   └── customPlan: object (optional)
├── sessions/{sessionId}
│   ├── templateId: string
│   ├── workoutTitle: string
│   ├── date: string
│   ├── startedAt: timestamp
│   ├── completedAt: timestamp
│   ├── status: "in_progress" | "completed"
│   └── exercises: array
├── weights/{dateKey}
│   ├── weight: number
│   ├── date: string
│   └── createdAt: timestamp
├── cardio/{sessionId}
│   ├── type: string
│   ├── date: string
│   ├── duration: number
│   └── ... (type-specific fields)
└── scheduleOverrides/{dateKey}
    ├── date: string
    └── isRestDay: boolean
```

## 🧪 Key Features Implementation

### Streak Calculation
- Counts consecutive days with completed workouts
- Ignores scheduled rest days
- Resets on missed workout days
- Today counts if workout completed

### Workout Rescheduling
- Cascade logic updates future schedule
- Preserves user-marked rest days
- Updates day-of-week assignments
- Maintains workout rotation

## 🎯 Admin Features

- Admin login bypass (tap "Welcome" 5 times)
- Skip onboarding flow
- Access to all features
- Account deletion capabilities

## 🔐 Security

- Phone-based authentication
- User-scoped Firestore rules
- Secure file uploads
- Environment variable protection
- Input validation
- XSS prevention

## 📱 Supported Platforms

- ✅ iOS (Expo Go & native build)
- ✅ Android (Expo Go & native build)
- ❌ Web (not optimized)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

