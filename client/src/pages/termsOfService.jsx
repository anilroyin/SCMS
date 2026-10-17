import "./privacyPolicy.css"

function TermsOfService() {
  return (
    <main className="privacy-page">
      <div className="privacy-content">
        <h1>Terms of Service</h1>
        <p className="privacy-updated">Last updated: October 18, 2026</p>

        <p>
          These Terms of Service govern the use of the Smart Coaching
          Management System (SCMS), a web application designed to support
          coaching centre administration. By accessing or using SCMS,
          you agree to these terms.
        </p>

        <h2>1. Purpose of SCMS</h2>
        <p>
          SCMS provides tools for managing student and teacher records,
          subjects, enrolments, fee payments, teacher payments, class
          schedules, notifications and administrative reports.
        </p>

        <h2>2. User Accounts</h2>
        <p>
          Users must provide accurate information when using the system
          and must keep their login credentials confidential. Users are
          responsible for activities performed through their accounts
          and should notify the administrator if they suspect unauthorised
          access.
        </p>

        <h2>3. Acceptable Use</h2>
        <p>
          Users must use SCMS only for authorised coaching centre activities.
          They must not attempt to access information without permission,
          interfere with system operation, misuse personal information or
          use the application for unlawful purposes.
        </p>

        <h2>4. Records and Payments</h2>
        <p>
          SCMS helps authorised users maintain student records, fee details,
          discounts, payment status and teacher payment calculations.
          The coaching centre remains responsible for checking the accuracy
          of entered information and verifying financial records before
          making decisions or payments.
        </p>

        <h2>5. Privacy and Password Resets</h2>
        <p>
          The collection and handling of personal information are described
          in the SCMS Privacy Policy. Password-reset emails may be sent to
          the registered email address to help users regain access to their
          accounts.
        </p>
        <p>
          <a href="/privacy-policy">Read the Privacy Policy</a>
        </p>

        <h2>6. Availability and Changes</h2>
        <p>
          SCMS is provided to support administrative work, but uninterrupted
          availability and error-free operation cannot be guaranteed.
          Features may be updated, changed or temporarily unavailable for
          maintenance or technical reasons.
        </p>

        <h2>7. Limitation of Responsibility</h2>
        <p>
          Users and administrators should maintain appropriate backups and
          verify important records. To the extent permitted by applicable
          law, the SCMS operator is not responsible for losses arising from
          inaccurate data entry, unauthorised account use or temporary
          service interruptions.
        </p>

        <h2>8. Suspension or Termination</h2>
        <p>
          Access may be suspended or terminated when necessary to protect
          the system, enforce these terms or comply with applicable law.
        </p>

        <h2>9. Changes to These Terms</h2>
        <p>
          These terms may be updated when SCMS functionality or its
          operating requirements change. The latest version will be
          published on this page.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about these terms, contact
          {" "}
          <a href="mailto:scmsmailer@gmail.com">scmsmailer@gmail.com</a>.
        </p>
      </div>
    </main>
  )
}

export default TermsOfService