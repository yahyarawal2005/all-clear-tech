const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

// Initialize Firebase Admin SDK
admin.initializeApp();

// Twilio Credentials (replace these with your actual credentials)
const accountSid = 'AC5f9cb3dd7ab5a8718075627ac108f25e';
const authToken = 'acd17e5806c4a37a29f29921a818eb61';
const twilioPhoneNumber = '+1234567890'; // Your Twilio phone number

const client = twilio(accountSid, authToken);

// Cloud Function to send SMS when a student is at risk
exports.sendRiskAlert = functions.firestore
    .document('students/{studentId}')
    .onUpdate(async (change, context) => {
        const student = change.after.data();
        const studentId = context.params.studentId;

        if (student.status === 'at-risk') {
            const message = `
                ALERT: Your child ${student.studentName} is at risk of dropping out.
                Attendance: ${student.attendance}%, Marks: ${student.marks}.
                Please contact the school immediately.
            `;

            try {
                // Send SMS to the student
                if (student.studentMobile) {
                    await client.messages.create({
                        body: message,
                        from: twilioPhoneNumber,
                        to: student.studentMobile
                    });
                }

                // Send SMS to the parent
                if (student.parentMobile) {
                    await client.messages.create({
                        body: message,
                        from: twilioPhoneNumber,
                        to: student.parentMobile
                    });
                }

                console.log('SMS alert sent successfully for student:', studentId);
            } catch (error) {
                console.error('Error sending SMS alert:', error);
            }
        }
    });
