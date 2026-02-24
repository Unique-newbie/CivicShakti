import nodemailer from 'nodemailer';

// Create a reusable transporter object using the default SMTP transport
// For MVP, we will use Ethereal (a fake SMTP service) if real creds aren't provided.
let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
        // Use real credentials if provided
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT, 10),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    } else {
        // Fallback to Ethereal for local testing
        console.log("No SMTP credentials found in environment. Generating ethereal test account...");
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
    }
    return transporter;
}

export async function sendStatusUpdateEmail(
    to: string,
    trackingId: string,
    newStatus: string,
    remarks: string,
    department: string
) {
    if (!to) {
        console.warn('sendEmail skipped: No recipient address provided.');
        return null;
    }

    try {
        const mailer = await getTransporter();

        const formattedStatus = newStatus.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1d4ed8; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">CivicShakti</h1>
                    <p style="margin: 5px 0 0 0; opacity: 0.9;">Complaint Status Update</p>
                </div>
                <div style="padding: 24px; background-color: #ffffff;">
                    <p style="font-size: 16px; color: #374151;">Dear Citizen,</p>
                    <p style="font-size: 16px; color: #374151;">
                        The status of your complaint <strong>#${trackingId}</strong> has been updated.
                    </p>
                    
                    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0 0 10px 0;"><strong>New Status:</strong> <span style="color: #1d4ed8;">${formattedStatus}</span></p>
                        <p style="margin: 0 0 10px 0;"><strong>Handling Department:</strong> ${department || 'General'}</p>
                        ${remarks ? `<p style="margin: 0;"><strong>Staff Remarks:</strong> <em>"${remarks}"</em></p>` : ''}
                    </div>

                    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                        You can track the full progress of your complaint on the CivicShakti platform using your tracking ID.
                    </p>
                </div>
                <div style="background-color: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                        This is an automated message. Please do not reply directly to this email.
                    </p>
                </div>
            </div>
        `;

        const info = await mailer.sendMail({
            from: '"CivicShakti Support" <noreply@civicshakti.gov>', // sender address
            to: to, // list of receivers
            subject: `Update on your CivicShakti Complaint #${trackingId}`, // Subject line
            html: htmlContent, // html body
        });

        console.log("Message sent: %s", info.messageId);

        // Preview only available when sending through an Ethereal account
        if (!process.env.SMTP_HOST) {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        return info;
    } catch (error) {
        console.error("Failed to send email:", error);
        throw error;
    }
}
