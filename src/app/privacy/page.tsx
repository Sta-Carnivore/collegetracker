import Link from 'next/link'
import { C } from '@/lib/atlas'

const TERMLY_STYLES = `
[data-custom-class='body'],[data-custom-class='body']*{background:transparent!important}
[data-custom-class='title'],[data-custom-class='title']*{font-family:var(--font-serif)!important;font-size:26px!important;color:${C.inkStrong}!important}
[data-custom-class='subtitle'],[data-custom-class='subtitle']*{font-family:var(--font-sans)!important;color:${C.inkMuted}!important;font-size:14px!important}
[data-custom-class='heading_1'],[data-custom-class='heading_1']*{font-family:var(--font-serif)!important;font-size:18px!important;color:${C.inkStrong}!important}
[data-custom-class='heading_2'],[data-custom-class='heading_2']*{font-family:var(--font-sans)!important;font-size:15px!important;color:${C.inkStrong}!important}
[data-custom-class='body_text'],[data-custom-class='body_text']*{color:${C.inkMuted}!important;font-size:14px!important;font-family:var(--font-sans)!important}
[data-custom-class='link'],[data-custom-class='link']*{color:${C.teal}!important;font-size:14px!important;font-family:var(--font-sans)!important;word-break:break-word!important}
h1,h2,h3{margin-top:1.5em;margin-bottom:0.5em}
ul{list-style-type:square;padding-left:1.5em}
ul>li>ul{list-style-type:circle}
table{border-collapse:collapse;width:100%;margin:1em 0}
td,th{border:1px solid ${C.border};padding:8px 12px;font-size:13px}
`

export default function PrivacyPage() {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      <style dangerouslySetInnerHTML={{ __html: TERMLY_STYLES }} />

      {/* Top bar */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '14px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.inkMuted, fontSize: 14, textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to ApplyTracker
        </Link>
      </div>

      <div style={{ maxWidth: 780, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div
          data-custom-class="body"
          dangerouslySetInnerHTML={{ __html: PRIVACY_CONTENT }}
        />
      </div>
    </div>
  )
}

const PRIVACY_CONTENT = `
<div><strong><span style="font-size:26px"><span data-custom-class="title"><h1>PRIVACY POLICY</h1></span></span></strong></div>
<div><span style="color:rgb(127,127,127)"><strong><span style="font-size:15px"><span data-custom-class="subtitle">Last updated June 11, 2026</span></span></strong></span></div>
<div><br></div>
<div style="line-height:1.5"><span style="color:rgb(89,89,89);font-size:15px"><span data-custom-class="body_text">This Privacy Notice for <strong>Chenyi Yang</strong> (doing business as <strong>ApplyTracker</strong>) ("<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>"), describes how and why we might access, collect, store, use, and/or share your personal information when you use our services, including when you visit our website at <a href="https://applytracker.io" data-custom-class="link">https://applytracker.io</a> or use ApplyTracker, a college application tracking platform that helps students organize schools, deadlines, essays, and materials. Includes AI-powered resume analysis and bio website generation.</span></span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span style="font-size:15px"><span data-custom-class="body_text"><strong>Questions or concerns?</strong> If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at <a href="mailto:stava.ziyi@gmail.com" data-custom-class="link">stava.ziyi@gmail.com</a>.</span></span></div>

<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><strong><span style="font-size:18px"><span data-custom-class="heading_1"><h2>TABLE OF CONTENTS</h2></span></span></strong></div>
<div style="line-height:1.5"><a href="#infocollect" data-custom-class="link">1. WHAT INFORMATION DO WE COLLECT?</a></div>
<div style="line-height:1.5"><a href="#infouse" data-custom-class="link">2. HOW DO WE PROCESS YOUR INFORMATION?</a></div>
<div style="line-height:1.5"><a href="#legalbases" data-custom-class="link">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</a></div>
<div style="line-height:1.5"><a href="#whoshare" data-custom-class="link">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></div>
<div style="line-height:1.5"><a href="#ai" data-custom-class="link">5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</a></div>
<div style="line-height:1.5"><a href="#sociallogins" data-custom-class="link">6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</a></div>
<div style="line-height:1.5"><a href="#intltransfers" data-custom-class="link">7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</a></div>
<div style="line-height:1.5"><a href="#inforetain" data-custom-class="link">8. HOW LONG DO WE KEEP YOUR INFORMATION?</a></div>
<div style="line-height:1.5"><a href="#infosafe" data-custom-class="link">9. HOW DO WE KEEP YOUR INFORMATION SAFE?</a></div>
<div style="line-height:1.5"><a href="#privacyrights" data-custom-class="link">10. WHAT ARE YOUR PRIVACY RIGHTS?</a></div>
<div style="line-height:1.5"><a href="#DNT" data-custom-class="link">11. CONTROLS FOR DO-NOT-TRACK FEATURES</a></div>
<div style="line-height:1.5"><a href="#uslaws" data-custom-class="link">12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</a></div>
<div style="line-height:1.5"><a href="#policyupdates" data-custom-class="link">13. DO WE MAKE UPDATES TO THIS NOTICE?</a></div>
<div style="line-height:1.5"><a href="#contact" data-custom-class="link">14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></div>
<div style="line-height:1.5"><a href="#request" data-custom-class="link">15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></div>

<div style="line-height:1.5"><br></div>
<div id="infocollect" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>1. WHAT INFORMATION DO WE COLLECT?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><strong>Personal Information Provided by You.</strong> We collect personal information that you voluntarily provide to us when you register on the Services. The personal information we collect may include: names, email addresses, usernames, passwords, billing addresses, and contact or authentication data.</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><strong>Sensitive Information.</strong> When necessary, with your consent or as otherwise permitted by applicable law, we process student data (including GPA, test scores, and school information).</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases. All payment data is handled and stored by <strong>Stripe</strong>. You may find their privacy notice at <a href="https://stripe.com/privacy" data-custom-class="link">https://stripe.com/privacy</a>.</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><strong>Social Media Login Data.</strong> We may provide you with the option to register with us using your existing Google account. If you choose to register in this way, we will collect certain profile information about you from Google.</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><strong>Google API.</strong> Our use of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" data-custom-class="link">Google API Services User Data Policy</a>, including the Limited Use requirements.</span></div>

<div style="line-height:1.5"><br></div>
<div id="infouse" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>2. HOW DO WE PROCESS YOUR INFORMATION?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">We process your personal information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. Specifically:</span></div>
<ul>
<li data-custom-class="body_text">To facilitate account creation and authentication</li>
<li data-custom-class="body_text">To deliver and facilitate delivery of services to the user</li>
<li data-custom-class="body_text">To respond to user inquiries and offer support</li>
<li data-custom-class="body_text">To send administrative information (OTP codes, account notices)</li>
<li data-custom-class="body_text">To fulfill and manage your orders and subscriptions</li>
<li data-custom-class="body_text">To protect our Services from fraud and abuse</li>
<li data-custom-class="body_text">To identify usage trends and improve our Services</li>
</ul>

<div style="line-height:1.5"><br></div>
<div id="legalbases" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR INFORMATION?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">We only process your personal information when we believe it is necessary and we have a valid legal reason to do so under applicable law — including your consent, performance of a contract, legitimate interests, or legal obligation.</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><em><strong>If you are located in the EU or UK:</strong></em> We rely on Consent, Performance of a Contract, Legitimate Interests, Legal Obligation, and Vital Interests as our lawful bases under the GDPR.</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><em><strong>If you are located in Canada:</strong></em> We process your information based on express or implied consent, or as otherwise permitted by applicable law.</span></div>

<div style="line-height:1.5"><br></div>
<div id="whoshare" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">We may share your data with third-party vendors who perform services for us:</span></div>
<ul>
<li data-custom-class="body_text"><strong>Anthropic</strong> — AI content generation (resume analysis, bio website)</li>
<li data-custom-class="body_text"><strong>Google</strong> — Social login (Google Sign-In)</li>
<li data-custom-class="body_text"><strong>Supabase</strong> — Database and authentication infrastructure</li>
<li data-custom-class="body_text"><strong>Stripe</strong> — Payment processing and billing</li>
<li data-custom-class="body_text"><strong>Railway</strong> — Website hosting</li>
</ul>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text">We may also share your information in connection with a merger, sale, or acquisition of our business.</span></div>

<div style="line-height:1.5"><br></div>
<div id="ai" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>5. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">Yes. We offer AI-powered features including resume analysis and bio website generation, powered by Anthropic. Your input and personal information will be shared with Anthropic to enable these features. You must not use our AI Products in any way that violates Anthropic's terms or policies.</span></div>

<div style="line-height:1.5"><br></div>
<div id="sociallogins" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>6. HOW DO WE HANDLE YOUR SOCIAL LOGINS?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">Our Services offer you the ability to register and log in using your Google account. Where you choose to do this, we will receive certain profile information about you from Google, which may include your name and email address. We will use this information only for the purposes described in this Privacy Notice.</span></div>

<div style="line-height:1.5"><br></div>
<div id="intltransfers" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">Our servers are located in the United States. If you are accessing our Services from outside the US, please be aware that your information may be transferred to, stored by, and processed by us in the United States. We have implemented the European Commission's Standard Contractual Clauses for transfers of personal information to ensure appropriate safeguards.</span></div>

<div style="line-height:1.5"><br></div>
<div id="inforetain" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>8. HOW LONG DO WE KEEP YOUR INFORMATION?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">We will only keep your personal information for as long as you have an account with us. When we have no ongoing legitimate business need to process your personal information, we will delete or anonymize it.</span></div>

<div style="line-height:1.5"><br></div>
<div id="infosafe" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>9. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">We have implemented appropriate technical and organizational security measures to protect your personal information. However, no electronic transmission over the Internet can be guaranteed to be 100% secure. You should only access the Services within a secure environment.</span></div>

<div style="line-height:1.5"><br></div>
<div id="privacyrights" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>10. WHAT ARE YOUR PRIVACY RIGHTS?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">Depending on where you are located, you may have the right to request access to, correction of, or deletion of your personal information. You may review, change, or terminate your account at any time by visiting <a href="https://applytracker.io/settings" data-custom-class="link">https://applytracker.io/settings</a>.</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text">If you have questions about your privacy rights, email us at <a href="mailto:stava.ziyi@gmail.com" data-custom-class="link">stava.ziyi@gmail.com</a>.</span></div>

<div style="line-height:1.5"><br></div>
<div id="DNT" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>11. CONTROLS FOR DO-NOT-TRACK FEATURES</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">Most web browsers include a Do-Not-Track ("DNT") feature. We do not currently respond to DNT browser signals as no uniform technology standard for recognizing and implementing DNT signals has been finalized.</span></div>

<div style="line-height:1.5"><br></div>
<div id="uslaws" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>12. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">If you are a resident of California, Colorado, Connecticut, or other US states with applicable privacy laws, you may have the right to request access to and receive details about the personal information we maintain about you, correct inaccuracies, or delete your personal information.</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><strong>Categories of personal information we collect:</strong> Identifiers (name, email), personal information (education, financial), commercial information (purchase history), education information (GPA, test scores), and sensitive personal information (account login credentials).</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text"><strong>To exercise your rights:</strong> Visit <a href="https://applytracker.io/settings" data-custom-class="link">https://applytracker.io/settings</a> or email us at <a href="mailto:stava.ziyi@gmail.com" data-custom-class="link">stava.ziyi@gmail.com</a>.</span></div>

<div style="line-height:1.5"><br></div>
<div id="policyupdates" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>13. DO WE MAKE UPDATES TO THIS NOTICE?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">Yes, we will update this notice as necessary to stay compliant with relevant laws. We encourage you to review this Privacy Notice frequently.</span></div>

<div style="line-height:1.5"><br></div>
<div id="contact" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>14. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">If you have questions or comments about this notice, you may email us at <a href="mailto:stava.ziyi@gmail.com" data-custom-class="link">stava.ziyi@gmail.com</a> or contact us by post at:</span></div>
<div style="line-height:1.5"><br></div>
<div style="line-height:1.5"><span data-custom-class="body_text">Chenyi Yang<br>5602 Sylmar Rd<br>Houston, TX 77081<br>United States</span></div>

<div style="line-height:1.5"><br></div>
<div id="request" style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>15. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2></span></strong></div>
<div style="line-height:1.5"><span data-custom-class="body_text">Based on the applicable laws of your country or state of residence, you may have the right to request access to the personal information we collect from you, correct inaccuracies, or delete your personal information. To request to review, update, or delete your personal information, please visit: <a href="https://applytracker.io/settings" data-custom-class="link">https://applytracker.io/settings</a>.</span></div>
`
