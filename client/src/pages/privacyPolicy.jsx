
import "./privacyPolicy.css"

function PrivacyPolicy() {
  return (
    <main className="privacy-page">
      <div className="privacy-content">
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: October 18, 2026</p>

        <p>
          Smart Coaching Management System (SCMS) is a web application
          designed to manage coaching centre activities, including student
          records, teacher information, subjects, fees, schedules and reports.
          This policy explains how information is handled when using SCMS.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          SCMS may process student and teacher details, contact information,
          enrolment records, fee and payment details, schedules, account
          information and email addresses used for password resets.
        </p>

        <h2>2. How We Use Information</h2>
        <p>
          Information is used to manage coaching records, maintain subject
          enrolments, record fees and discounts, calculate teacher payments,
          generate receipts and reports, authenticate users and send
          password-reset emails.
        </p>

        <h2>3. Password Reset Emails</h2>
        <p>
          SCMS uses the Google Gmail API to send password-reset emails from
          its configured email account. When a user requests a password reset,
          their registered email address is used to deliver a time-limited
          reset link. SCMS uses this service to send emails and does not need
          to read users' inboxes for this purpose.
        </p>
        <p>
          Google's privacy policy:
          {" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
          >
            https://policies.google.com/privacy
          </a>
        </p>

        <h2>4. Information Sharing</h2>
        <p>
          SCMS does not sell personal information. Information may be processed
          by service providers supporting the application's hosting, database
          and email delivery, or disclosed when required by law.
        </p>

        <h2>5. Data Security</h2>
        <p>
          SCMS uses measures intended to protect information, including
          authentication controls and time-limited password-reset links.
          However, no online system can guarantee absolute security. Users
          should keep their credentials confidential.
        </p>

        <h2>6. Data Retention</h2>
        <p>
          Information may be retained as necessary to operate SCMS, maintain
          coaching records and meet legitimate administrative or legal
          requirements.
        </p>

        <h2>7. Children's Information</h2>
        <p>
          SCMS may process student information, including information about
          minors, for coaching administration. Access should be limited to
          authorised users with a legitimate purpose.
        </p>

        <h2>8. Your Privacy and Contact</h2>
        <p>
          For questions about information handled through SCMS, contact:
          {" "}
          <a href="mailto:scmsmailer@gmail.com">
            scmsmailer@gmail.com
          </a>
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          This policy may be updated when SCMS functionality or information
          handling practices change. The latest version will be published
          on this page.
        </p>
      </div>
    </main>
  )
}

export default PrivacyPolicy