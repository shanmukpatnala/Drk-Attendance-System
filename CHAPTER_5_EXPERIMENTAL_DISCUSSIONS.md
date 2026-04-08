# CHAPTER 5: EXPERIMENTAL DISCUSSIONS

## 5.1 Data Set

The DRK Attendance System does not rely on a static academic dataset like image-captioning projects. Instead, it operates on a live institutional dataset stored in Firebase Firestore and generated dynamically through day-to-day usage of the application. The primary working data of the system consists of student registration records, facial descriptors extracted during registration, attendance entries captured during face-based marking, user account data for faculty and administrators, and report records generated for academic monitoring.

The main collections used by the system are organized under the project workspace in Firestore. The `students` collection stores student profile details such as roll number, name, branch, year, phone number, email, approval status, and the facial descriptor used for recognition. The `attendance_daily/{date}/logs` collection stores one attendance record per student for each day, which helps prevent duplicate marking. The `attendance_logs` collection stores the overall attendance history with timestamped entries for long-term analysis. In addition, `app_users` maintains login information for faculty, HOD, dean, principal, and admin accounts, while the `reports` collection stores generated attendance-report content.

For student registration, the system accepts either live camera capture or uploaded image input. During registration, the face is detected and converted into a numerical descriptor using `face-api.js`. This descriptor becomes the core biometric reference for future matching. Hence, the dataset used by the application is not only textual and tabular, but also biometric in nature.

The system also supports student self-registration. In that workflow, a student can submit a profile with a valid roll number and face image, but the record remains in a pending state until branch HOD approval is completed. This creates a moderated dataset where unauthorized or incomplete profiles do not directly enter the active attendance flow. As a result, the data used by the attendance engine is both structured and quality-controlled.

## 5.2 Technologies Used

The DRK Attendance System is implemented as a modern web application using React with Vite for fast development and build performance. The frontend is responsible for login, registration, attendance scanning, dashboard navigation, report generation, history browsing, and student self-service operations. The user interface is built with reusable screen and modal components, which improves maintainability and reduces repetition.

Firebase is used as the main backend platform. Firebase Authentication is used for anonymous initialization of the app session, while Cloud Firestore is used for real-time storage of students, users, attendance logs, approval records, and reports. Firebase Storage support is also configured for handling media-related workflows where needed.

Face recognition is powered by `face-api.js`, which loads pre-trained deep learning models for face detection, landmark extraction, and face recognition. The system uses these models during both registration and attendance marking. A facial descriptor generated at registration time is stored in the student record and later compared against live face detections during attendance sessions using a `FaceMatcher`. Matching thresholds are defined in the application to reduce false matches and ambiguous recognition results.

Additional supporting libraries are used for specialized tasks. `EmailJS` is integrated for sending password reset links and report previews to HOD users. `qrcode.react` is used for QR-based student identity card generation. `jsPDF` and `jspdf-autotable` are included for document-generation support, while CSV export is used directly in the current report-download workflow. Tailwind CSS is used for styling and responsive layout design. Altogether, the selected technology stack provides biometric recognition, real-time database support, communication features, and a mobile-friendly web interface in a single deployable system.

## 5.3 Performance Metrics

Since this project is an intelligent attendance application rather than a conventional classification model trained on benchmark labels, performance evaluation is based on functional accuracy, recognition reliability, responsiveness, and report correctness.

The first important metric is **face recognition reliability**. The application compares live facial descriptors with stored student descriptors using configured threshold values. Lower distance values indicate stronger similarity between the live face and the stored student profile. The system also uses ambiguity-gap checks to avoid accepting uncertain matches when two candidates are too close in score. This improves practical accuracy during attendance sessions.

The second metric is **duplicate-prevention accuracy**. Once a student is marked for the day, the system checks the corresponding `attendance_daily/{date}/logs` record before allowing a new entry. This ensures that the same student is not counted multiple times on the same date. From a system perspective, successful prevention of duplicate marking is a major correctness metric because it directly affects final attendance reports.

The third metric is **data validation accuracy**. Roll numbers are validated against the institutional format, phone numbers are restricted to ten digits, and student approval status is checked before student login is allowed. These validations reduce invalid data entry and improve trust in the database used by the attendance engine.

The fourth metric is **report-generation correctness**. For any selected branch, year, and date, the generated report must correctly classify each student as present or absent based on the real-time daily log. The application also computes attendance percentage for student-history views by comparing total present days against total working days in the selected date range.

The fifth metric is **system responsiveness**. Performance is reflected in how quickly the app loads face-recognition models, opens the camera, registers a face, updates the Firestore database, and displays report or history results. Because the application uses real-time listeners for students and attendance logs, newly added or updated records are reflected immediately in the user interface, which improves operational efficiency in real college usage.

## 5.4 Results and Analysis

The developed system successfully demonstrates that face-based attendance management can be implemented as a practical, browser-accessible solution using React, Firebase, and `face-api.js`. The experimental behavior observed from the implemented modules shows that the system supports the full attendance cycle: faculty login, student registration, live face capture, face-based identification, attendance logging, branch-wise report generation, student-history tracking, and approval-based student onboarding.

During registration, the system captures or uploads a student image, detects the face, extracts facial landmarks and descriptors, and stores the processed information in Firestore. This created the biometric base required for future attendance sessions. Registration also handled duplicate roll number checks, overwrite control for updates, and pending approval workflows for self-registered students. These steps improved the quality and consistency of stored student records.

During attendance sessions, the application continuously scans the live video stream, detects faces, compares descriptors against registered student profiles, and marks students as present when the match is reliable. If a face is unknown or ambiguous, the application avoids incorrect marking and prompts the user with a controlled workflow. If a student is already marked for the day, the app shows an "already present" response instead of inserting duplicate data. This indicates that the recognition logic is supported by safety checks rather than raw matching alone.

The reporting module produced meaningful academic outputs. For a selected branch and year, the system generated present/absent status lists for the chosen date and allowed CSV export of the final report. The HOD email-preview workflow further extended the usefulness of the attendance data by enabling report communication directly from the system. This shows that the project is not limited to attendance capture, but also supports administrative follow-up and departmental monitoring.

The student-facing modules also contributed to the overall experimental success of the project. A student can log in using roll number, view attendance percentage, inspect the attendance timeline, and access an ID card. These features transform the system from a faculty-only tool into a shared academic platform with transparent access to attendance information.

From analysis of the implementation, the major strengths of the system are real-time synchronization, biometric attendance capture, duplicate prevention, approval-based profile control, and automated report preparation. The main practical limitations are dependency on camera quality, lighting conditions, internet connectivity, and the accuracy of stored face descriptors. Even with these limitations, the system demonstrates strong feasibility for institutional deployment because it automates time-consuming attendance tasks and improves record transparency.

Overall, the experimental outcome confirms that the DRK Attendance System is a functional smart-attendance platform. It integrates biometric recognition, role-based access, data validation, and attendance analytics into a single application. The implemented codebase shows that the project is not only conceptually valid but also operationally complete enough to support real educational use.
