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
ul>li>ul>li>ul{list-style-type:square}
table{border-collapse:collapse;width:100%;margin:1em 0}
td,th{border:1px solid ${C.border};padding:8px 12px;font-size:13px}
`

export default function TermsPage() {
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
          dangerouslySetInnerHTML={{ __html: TERMS_CONTENT }}
        />
      </div>
    </div>
  )
}

const TERMS_CONTENT = `
<div data-custom-class="title"><strong><h1>TERMS AND CONDITIONS</h1></strong></div>
<div data-custom-class="subtitle"><strong>Last updated June 11, 2026</strong></div>
<div style="line-height:1.5"><br></div>

<div style="line-height:1.5"><strong><span data-custom-class="heading_1"><h2>AGREEMENT TO OUR LEGAL TERMS</h2></span></strong></div>

<div data-custom-class="body_text" style="line-height:1.5">We are <strong>Chenyi Yang</strong>, doing business as <strong>ApplyTracker</strong> ("Company," "we," "us," "our"), a company registered in Texas, United States.</div>
<div style="line-height:1;"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">We operate the website <a href="https://applytracker.io" data-custom-class="link">https://applytracker.io</a> (the "Site"), as well as any other related products and services that refer or link to these legal terms (collectively, the "Services").</div>
<div style="line-height:1;"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">ApplyTracker is a college application tracking platform that helps students organize schools, deadlines, essays, and materials. Includes AI-powered resume analysis and bio website generation.</div>
<div style="line-height:1;"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">You can contact us by email at <a href="mailto:stava.ziyi@gmail.com" data-custom-class="link">stava.ziyi@gmail.com</a>.</div>
<div style="line-height:1;"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">These Legal Terms constitute a legally binding agreement between you and Chenyi Yang, concerning your access to and use of the Services. You agree that by accessing the Services, you have read, understood, and agreed to be bound by all of these Legal Terms. IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</div>
<div style="line-height:1;"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will become effective upon posting or notifying you by <a href="mailto:stava.ziyi@gmail.com" data-custom-class="link">stava.ziyi@gmail.com</a>. By continuing to use the Services after the effective date of any changes, you agree to be bound by the modified terms.</div>
<div style="line-height:1;"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">The Services are intended for users who are at least 13 years of age. All users who are minors in the jurisdiction in which they reside (generally under the age of 18) must have the permission of, and be directly supervised by, their parent or guardian to use the Services.</div>
<div style="line-height:1;"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">We recommend that you print a copy of these Legal Terms for your records.</div>
<div style="line-height:1.5"><br></div>

<div data-custom-class="heading_1" style="line-height:1.5"><strong><h2>TABLE OF CONTENTS</h2></strong></div>
<div style="line-height:1.5"><a href="#services" data-custom-class="link">1. OUR SERVICES</a></div>
<div style="line-height:1.5"><a href="#ip" data-custom-class="link">2. INTELLECTUAL PROPERTY RIGHTS</a></div>
<div style="line-height:1.5"><a href="#userreps" data-custom-class="link">3. USER REPRESENTATIONS</a></div>
<div style="line-height:1.5"><a href="#userreg" data-custom-class="link">4. USER REGISTRATION</a></div>
<div style="line-height:1.5"><a href="#purchases" data-custom-class="link">5. PURCHASES AND PAYMENT</a></div>
<div style="line-height:1.5"><a href="#subscriptions" data-custom-class="link">6. SUBSCRIPTIONS</a></div>
<div style="line-height:1.5"><a href="#returnno" data-custom-class="link">7. REFUND POLICY</a></div>
<div style="line-height:1.5"><a href="#prohibited" data-custom-class="link">8. PROHIBITED ACTIVITIES</a></div>
<div style="line-height:1.5"><a href="#ugc" data-custom-class="link">9. USER GENERATED CONTRIBUTIONS</a></div>
<div style="line-height:1.5"><a href="#license" data-custom-class="link">10. CONTRIBUTION LICENSE</a></div>
<div style="line-height:1.5"><a href="#thirdparty" data-custom-class="link">11. THIRD-PARTY WEBSITES AND CONTENT</a></div>
<div style="line-height:1.5"><a href="#sitemanage" data-custom-class="link">12. SERVICES MANAGEMENT</a></div>
<div style="line-height:1.5"><a href="#ppyes" data-custom-class="link">13. PRIVACY POLICY</a></div>
<div style="line-height:1.5"><a href="#terms" data-custom-class="link">14. TERM AND TERMINATION</a></div>
<div style="line-height:1.5"><a href="#modifications" data-custom-class="link">15. MODIFICATIONS AND INTERRUPTIONS</a></div>
<div style="line-height:1.5"><a href="#law" data-custom-class="link">16. GOVERNING LAW</a></div>
<div style="line-height:1.5"><a href="#disputes" data-custom-class="link">17. DISPUTE RESOLUTION</a></div>
<div style="line-height:1.5"><a href="#corrections" data-custom-class="link">18. CORRECTIONS</a></div>
<div style="line-height:1.5"><a href="#disclaimer" data-custom-class="link">19. DISCLAIMER</a></div>
<div style="line-height:1.5"><a href="#liability" data-custom-class="link">20. LIMITATIONS OF LIABILITY</a></div>
<div style="line-height:1.5"><a href="#indemnification" data-custom-class="link">21. INDEMNIFICATION</a></div>
<div style="line-height:1.5"><a href="#userdata" data-custom-class="link">22. USER DATA</a></div>
<div style="line-height:1.5"><a href="#electronic" data-custom-class="link">23. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</a></div>
<div style="line-height:1.5"><a href="#california" data-custom-class="link">24. CALIFORNIA USERS AND RESIDENTS</a></div>
<div style="line-height:1.5"><a href="#misc" data-custom-class="link">25. MISCELLANEOUS</a></div>
<div style="line-height:1.5"><a href="#contact" data-custom-class="link">26. CONTACT US</a></div>

<div style="line-height:1.5"><br></div>
<div id="services" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>1. OUR SERVICES</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country where such distribution or use would be contrary to law or regulation or which would subject us to any registration requirement within such jurisdiction or country. Accordingly, those persons who choose to access the Services from other locations do so on their own initiative and are solely responsible for compliance with local laws, if and to the extent local laws are applicable.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">The Services are not tailored to comply with industry-specific regulations (HIPAA, FISMA, etc.), so if your interactions would be subjected to such laws, you may not use the Services. You may not use the Services in a way that would violate the Gramm-Leach-Bliley Act (GLBA).</div>

<div style="line-height:1.5"><br></div>
<div id="ip" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>2. INTELLECTUAL PROPERTY RIGHTS</h2></strong></div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Our intellectual property</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">We are the owner or the licensee of all intellectual property rights in our Services, including all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics in the Services (collectively, the "Content"), as well as the trademarks, service marks, and logos contained therein (the "Marks"). Our Content and Marks are protected by copyright and trademark laws in the United States and around the world. The Content and Marks are provided in or through the Services "AS IS" for your personal, non-commercial use only.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Your use of our Services</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">Subject to your compliance with these Legal Terms, including the <a href="#prohibited" data-custom-class="link">PROHIBITED ACTIVITIES</a> section below, we grant you a non-exclusive, non-transferable, revocable license to access the Services and download or print a copy of any portion of the Content to which you have properly gained access, solely for your personal, non-commercial use.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">Except as set out in this section or elsewhere in our Legal Terms, no part of the Services and no Content or Marks may be copied, reproduced, aggregated, republished, uploaded, posted, publicly displayed, encoded, translated, transmitted, distributed, sold, licensed, or otherwise exploited for any commercial purpose whatsoever, without our express prior written permission.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">We reserve all rights not expressly granted to you in and to the Services, Content, and Marks. Any breach of these Intellectual Property Rights will constitute a material breach of our Legal Terms and your right to use our Services will terminate immediately.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Your submissions</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5"><strong>Submissions:</strong> By directly sending us any question, comment, suggestion, idea, feedback, or other information about the Services ("Submissions"), you agree to assign to us all intellectual property rights in such Submission. You agree that we shall own this Submission and be entitled to its unrestricted use and dissemination for any lawful purpose, commercial or otherwise, without acknowledgment or compensation to you.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5"><strong>You are responsible for what you post or upload:</strong> By sending us Submissions through any part of the Services you confirm that you have read and agree with our <a href="#prohibited" data-custom-class="link">PROHIBITED ACTIVITIES</a> and will not post, send, publish, upload, or transmit through the Services any Submission that is illegal, harassing, hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually explicit, false, inaccurate, deceitful, or misleading. You are solely responsible for your Submissions.</div>

<div style="line-height:1.5"><br></div>
<div id="userreps" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>3. USER REPRESENTATIONS</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">By using the Services, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information; (3) you have the legal capacity and you agree to comply with these Legal Terms; (4) you are not under the age of 13; (5) you are not a minor in the jurisdiction in which you reside, or if a minor, you have received parental permission to use the Services; (6) you will not access the Services through automated or non-human means; (7) you will not use the Services for any illegal or unauthorized purpose; and (8) your use of the Services will not violate any applicable law or regulation.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">If you provide any information that is untrue, inaccurate, not current, or incomplete, we have the right to suspend or terminate your account and refuse any and all current or future use of the Services.</div>

<div style="line-height:1.5"><br></div>
<div id="userreg" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>4. USER REGISTRATION</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your account and password. We reserve the right to remove, reclaim, or change a username you select if we determine, in our sole discretion, that such username is inappropriate, obscene, or otherwise objectionable.</div>

<div style="line-height:1.5"><br></div>
<div id="purchases" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>5. PURCHASES AND PAYMENT</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">We accept the following forms of payment:</div>
<ul>
<li data-custom-class="body_text">Visa</li>
<li data-custom-class="body_text">Mastercard</li>
<li data-custom-class="body_text">American Express</li>
<li data-custom-class="body_text">Discover</li>
</ul>
<div data-custom-class="body_text" style="line-height:1.5">You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. You further agree to promptly update account and payment information, including email address, payment method, and payment card expiration date. All payments shall be in US dollars.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">You agree to pay all charges at the prices then in effect for your purchases, and you authorize us to charge your chosen payment provider for any such amounts. We reserve the right to correct any errors or mistakes in pricing, even if we have already requested or received payment. We reserve the right to refuse any order placed through the Services.</div>

<div style="line-height:1.5"><br></div>
<div id="subscriptions" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>6. SUBSCRIPTIONS</h2></strong></div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Billing and Renewal</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">Your subscription will continue and automatically renew unless canceled. You consent to our charging your payment method on a recurring basis without requiring your prior approval for each recurring charge, until such time as you cancel the applicable order. The length of your billing cycle will depend on the type of subscription plan you choose when you subscribed to the Services.</div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Cancellation</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">You can cancel your subscription at any time by logging into your account. Your cancellation will take effect at the end of the current paid term. If you have any questions or are unsatisfied with our Services, please email us at <a href="mailto:stava.ziyi@gmail.com" data-custom-class="link">stava.ziyi@gmail.com</a>.</div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Fee Changes</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">We may, from time to time, make changes to the subscription fee and will communicate any price changes to you in accordance with applicable law.</div>

<div style="line-height:1.5"><br></div>
<div id="returnno" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>7. REFUND POLICY</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">All sales are final and no refund will be issued.</div>

<div style="line-height:1.5"><br></div>
<div id="prohibited" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>8. PROHIBITED ACTIVITIES</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">You may not access or use the Services for any purpose other than that for which we make the Services available. As a user of the Services, you agree not to:</div>
<ul>
<li data-custom-class="body_text">Systematically retrieve data or other content from the Services to create or compile a collection, compilation, database, or directory without written permission from us.</li>
<li data-custom-class="body_text">Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
<li data-custom-class="body_text">Circumvent, disable, or otherwise interfere with security-related features of the Services.</li>
<li data-custom-class="body_text">Disparage, tarnish, or otherwise harm, in our opinion, us and/or the Services.</li>
<li data-custom-class="body_text">Use any information obtained from the Services in order to harass, abuse, or harm another person.</li>
<li data-custom-class="body_text">Make improper use of our support services or submit false reports of abuse or misconduct.</li>
<li data-custom-class="body_text">Use the Services in a manner inconsistent with any applicable laws or regulations.</li>
<li data-custom-class="body_text">Engage in unauthorized framing of or linking to the Services.</li>
<li data-custom-class="body_text">Upload or transmit viruses, Trojan horses, or other material that interferes with any party's uninterrupted use and enjoyment of the Services.</li>
<li data-custom-class="body_text">Engage in any automated use of the system, such as using scripts to send comments or messages, or using any data mining, robots, or similar data gathering and extraction tools.</li>
<li data-custom-class="body_text">Delete the copyright or other proprietary rights notice from any Content.</li>
<li data-custom-class="body_text">Attempt to impersonate another user or person or use the username of another user.</li>
<li data-custom-class="body_text">Interfere with, disrupt, or create an undue burden on the Services or the networks or services connected to the Services.</li>
<li data-custom-class="body_text">Harass, annoy, intimidate, or threaten any of our employees or agents.</li>
<li data-custom-class="body_text">Attempt to bypass any measures of the Services designed to prevent or restrict access to the Services.</li>
<li data-custom-class="body_text">Copy or adapt the Services' software, including but not limited to Flash, PHP, HTML, JavaScript, or other code.</li>
<li data-custom-class="body_text">Except as permitted by applicable law, decipher, decompile, disassemble, or reverse engineer any of the software comprising or in any way making up a part of the Services.</li>
<li data-custom-class="body_text">Use any automated system to access the Services, or use any unauthorized script or other software.</li>
<li data-custom-class="body_text">Make any unauthorized use of the Services, including collecting usernames and/or email addresses of users by electronic or other means for the purpose of sending unsolicited email.</li>
<li data-custom-class="body_text">Use the Services as part of any effort to compete with us or otherwise use the Services for any revenue-generating endeavor or commercial enterprise.</li>
</ul>

<div style="line-height:1.5"><br></div>
<div id="ugc" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>9. USER GENERATED CONTRIBUTIONS</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">The Services does not offer users to submit or post content. We may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Services. Any Contributions you transmit may be treated in accordance with the Services' Privacy Policy. When you create or make available any Contributions, you represent and warrant that your Contributions are not false, inaccurate, or misleading, not unsolicited or unauthorized advertising or spam, not obscene, lewd, or otherwise objectionable, and do not violate any applicable law, regulation, or rule.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">Any use of the Services in violation of the foregoing violates these Legal Terms and may result in, among other things, termination or suspension of your rights to use the Services.</div>

<div style="line-height:1.5"><br></div>
<div id="license" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>10. CONTRIBUTION LICENSE</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">You and Services agree that we may access, store, process, and use any information and personal data that you provide following the terms of the Privacy Policy and your choices (including settings).</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">By submitting suggestions or other feedback regarding the Services, you agree that we can use and share such feedback for any purpose without compensation to you.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">We do not assert any ownership over your Contributions. You retain full ownership of all of your Contributions and any intellectual property rights or other proprietary rights associated with your Contributions. We are not liable for any statements or representations in your Contributions. You are solely responsible for your Contributions to the Services.</div>

<div style="line-height:1.5"><br></div>
<div id="thirdparty" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>11. THIRD-PARTY WEBSITES AND CONTENT</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">The Services may contain links to other websites ("Third-Party Websites") as well as articles, photographs, text, graphics, pictures, designs, music, sound, video, information, applications, software, and other content or items belonging to or originating from third parties ("Third-Party Content"). Such Third-Party Websites and Third-Party Content are not investigated, monitored, or checked for accuracy, appropriateness, or completeness by us, and we are not responsible for any Third-Party Websites accessed through the Services or any Third-Party Content posted on, available through, or installed from the Services.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">Inclusion of, linking to, or permitting the use or installation of any Third-Party Websites or any Third-Party Content does not imply approval or endorsement thereof by us. If you decide to leave the Services and access the Third-Party Websites or to use or install any Third-Party Content, you do so at your own risk, and you should be aware these Legal Terms no longer govern.</div>

<div style="line-height:1.5"><br></div>
<div id="sitemanage" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>12. SERVICES MANAGEMENT</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">We reserve the right, but not the obligation, to: (1) monitor the Services for violations of these Legal Terms; (2) take appropriate legal action against anyone who, in our sole discretion, violates the law or these Legal Terms; (3) in our sole discretion and without limitation, refuse, restrict access to, limit the availability of, or disable any of your Contributions or any portion thereof; (4) in our sole discretion and without limitation, notice, or liability, to remove from the Services or otherwise disable all files and content that are excessive in size or are in any way burdensome to our systems; and (5) otherwise manage the Services in a manner designed to protect our rights and property.</div>

<div style="line-height:1.5"><br></div>
<div id="ppyes" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>13. PRIVACY POLICY</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">We care about data privacy and security. Please review our Privacy Policy: <a href="https://applytracker.io/privacy" data-custom-class="link">https://applytracker.io/privacy</a>. By using the Services, you agree to be bound by our Privacy Policy, which is incorporated into these Legal Terms. Please be advised the Services are hosted in the United States. Further, we do not knowingly accept, request, or solicit information from children or knowingly market to children. In accordance with the U.S. Children's Online Privacy Protection Act, if we receive actual knowledge that anyone under the age of 13 has provided personal information to us without the requisite and verifiable parental consent, we will delete that information from the Services as quickly as is reasonably practical.</div>

<div style="line-height:1.5"><br></div>
<div id="terms" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>14. TERM AND TERMINATION</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">These Legal Terms shall remain in full force and effect while you use the Services. WITHOUT LIMITING ANY OTHER PROVISION OF THESE LEGAL TERMS, WE RESERVE THE RIGHT TO, IN OUR SOLE DISCRETION AND WITHOUT NOTICE OR LIABILITY, DENY ACCESS TO AND USE OF THE SERVICES (INCLUDING BLOCKING CERTAIN IP ADDRESSES), TO ANY PERSON FOR ANY REASON OR FOR NO REASON, INCLUDING WITHOUT LIMITATION FOR BREACH OF ANY REPRESENTATION, WARRANTY, OR COVENANT CONTAINED IN THESE LEGAL TERMS OR OF ANY APPLICABLE LAW OR REGULATION. WE MAY TERMINATE YOUR USE OR PARTICIPATION IN THE SERVICES OR DELETE YOUR ACCOUNT AND ANY CONTENT OR INFORMATION THAT YOU POSTED AT ANY TIME, WITHOUT WARNING, IN OUR SOLE DISCRETION.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">If we terminate or suspend your account for any reason, you are prohibited from registering and creating a new account under your name, a fake or borrowed name, or the name of any third party. In addition to terminating or suspending your account, we reserve the right to take appropriate legal action, including without limitation pursuing civil, criminal, and injunctive redress.</div>

<div style="line-height:1.5"><br></div>
<div id="modifications" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>15. MODIFICATIONS AND INTERRUPTIONS</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice. We will not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the Services.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems or need to perform maintenance related to the Services, resulting in interruptions, delays, or errors. You agree that we have no liability whatsoever for any loss, damage, or inconvenience caused by your inability to access or use the Services during any downtime or discontinuance of the Services.</div>

<div style="line-height:1.5"><br></div>
<div id="law" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>16. GOVERNING LAW</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">These Legal Terms and your use of the Services are governed by and construed in accordance with the laws of the State of Texas applicable to agreements made and to be entirely performed within the State of Texas, without regard to its conflict of law principles.</div>

<div style="line-height:1.5"><br></div>
<div id="disputes" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>17. DISPUTE RESOLUTION</h2></strong></div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Informal Negotiations</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">To expedite resolution and control the cost of any dispute, controversy, or claim related to these Legal Terms (each a "Dispute"), the Parties agree to first attempt to negotiate any Dispute informally for at least thirty (30) days before initiating arbitration. Such informal negotiations commence upon written notice from one Party to the other Party.</div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Binding Arbitration</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">If the Parties are unable to resolve a Dispute through informal negotiations, the Dispute will be finally and exclusively resolved by binding arbitration. YOU UNDERSTAND THAT WITHOUT THIS PROVISION, YOU WOULD HAVE THE RIGHT TO SUE IN COURT AND HAVE A JURY TRIAL. The arbitration shall be commenced and conducted under the Commercial Arbitration Rules of the American Arbitration Association (AAA) and, where appropriate, the AAA's Supplementary Procedures for Consumer Related Disputes. If such costs are determined by the arbitrator to be excessive, we will pay all arbitration fees and expenses. The arbitration will take place in Harris County, Texas.</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5">If for any reason, a Dispute proceeds in court rather than arbitration, the Dispute shall be commenced or prosecuted in the state and federal courts located in Harris County, Texas, and the Parties hereby consent to, and waive all defenses of lack of personal jurisdiction, and forum non conveniens with respect to venue and jurisdiction in such courts.</div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Restrictions</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">The Parties agree that any arbitration shall be limited to the Dispute between the Parties individually. To the full extent permitted by law, (a) no arbitration shall be joined with any other proceeding; (b) there is no right or authority for any Dispute to be arbitrated on a class-action basis; and (c) there is no right or authority for any Dispute to be brought in a purported representative capacity on behalf of the general public or any other persons.</div>
<div data-custom-class="heading_2" style="line-height:1.5"><strong><h3>Exceptions to Informal Negotiations and Arbitration</h3></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">The Parties agree that the following Disputes are not subject to the above provisions concerning informal negotiations and binding arbitration: (a) any Disputes seeking to enforce or protect, or concerning the validity of, any of the intellectual property rights of a Party; (b) any Dispute related to, or arising from, allegations of theft, piracy, invasion of privacy, or unauthorized use; and (c) any claim for injunctive relief.</div>

<div style="line-height:1.5"><br></div>
<div id="corrections" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>18. CORRECTIONS</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">There may be information on the Services that contains typographical errors, inaccuracies, or omissions, including descriptions, pricing, availability, and various other information. We reserve the right to correct any errors, inaccuracies, or omissions and to change or update the information on the Services at any time, without prior notice.</div>

<div style="line-height:1.5"><br></div>
<div id="disclaimer" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>19. DISCLAIMER</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE MAKE NO WARRANTIES OR REPRESENTATIONS ABOUT THE ACCURACY OR COMPLETENESS OF THE SERVICES' CONTENT AND WE WILL ASSUME NO LIABILITY OR RESPONSIBILITY FOR ANY ERRORS, MISTAKES, OR INACCURACIES OF CONTENT AND MATERIALS, PERSONAL INJURY OR PROPERTY DAMAGE RESULTING FROM YOUR ACCESS TO AND USE OF THE SERVICES, ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SECURE SERVERS AND/OR ANY AND ALL PERSONAL INFORMATION STORED THEREIN, OR ANY INTERRUPTION OR CESSATION OF TRANSMISSION TO OR FROM THE SERVICES.</div>

<div style="line-height:1.5"><br></div>
<div id="liability" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>20. LIMITATIONS OF LIABILITY</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY, INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFIT, LOST REVENUE, LOSS OF DATA, OR OTHER DAMAGES ARISING FROM YOUR USE OF THE SERVICES, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. NOTWITHSTANDING ANYTHING TO THE CONTRARY CONTAINED HEREIN, OUR LIABILITY TO YOU FOR ANY CAUSE WHATSOEVER AND REGARDLESS OF THE FORM OF THE ACTION, WILL AT ALL TIMES BE LIMITED TO THE AMOUNT PAID, IF ANY, BY YOU TO US DURING THE ONE (1) MONTH PERIOD PRIOR TO ANY CAUSE OF ACTION ARISING. CERTAIN US STATE LAWS AND INTERNATIONAL LAWS DO NOT ALLOW LIMITATIONS ON IMPLIED WARRANTIES OR THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES. IF THESE LAWS APPLY TO YOU, SOME OR ALL OF THE ABOVE DISCLAIMERS OR LIMITATIONS MAY NOT APPLY TO YOU, AND YOU MAY HAVE ADDITIONAL RIGHTS.</div>

<div style="line-height:1.5"><br></div>
<div id="indemnification" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>21. INDEMNIFICATION</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">You agree to defend, indemnify, and hold us harmless, including our subsidiaries, affiliates, and all of our respective officers, agents, partners, and employees, from and against any loss, damage, liability, claim, or demand, including reasonable attorneys' fees and expenses, made by any third party due to or arising out of: (1) use of the Services; (2) breach of these Legal Terms; (3) any breach of your representations and warranties set forth in these Legal Terms; (4) your violation of the rights of a third party, including but not limited to intellectual property rights; or (5) any overt harmful act toward any other user of the Services with whom you connected via the Services.</div>

<div style="line-height:1.5"><br></div>
<div id="userdata" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>22. USER DATA</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data relating to your use of the Services. Although we perform regular routine backups of data, you are solely responsible for all data that you transmit or that relates to any activity you have undertaken using the Services. You agree that we shall have no liability to you for any loss or corruption of any such data, and you hereby waive any right of action against us arising from any such loss or corruption of such data.</div>

<div style="line-height:1.5"><br></div>
<div id="electronic" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>23. ELECTRONIC COMMUNICATIONS, TRANSACTIONS, AND SIGNATURES</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically, via email and on the Services, satisfy any legal requirement that such communication be in writing. YOU HEREBY AGREE TO THE USE OF ELECTRONIC SIGNATURES, CONTRACTS, ORDERS, AND OTHER RECORDS, AND TO ELECTRONIC DELIVERY OF NOTICES, POLICIES, AND RECORDS OF TRANSACTIONS INITIATED OR COMPLETED BY US OR VIA THE SERVICES.</div>

<div style="line-height:1.5"><br></div>
<div id="california" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>24. CALIFORNIA USERS AND RESIDENTS</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs in writing at 1625 North Market Blvd., Suite N 112, Sacramento, California 95834 or by telephone at (800) 952-5210 or (916) 445-1254.</div>

<div style="line-height:1.5"><br></div>
<div id="misc" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>25. MISCELLANEOUS</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">These Legal Terms and any policies or operating rules posted by us on the Services or in respect to the Services constitute the entire agreement and understanding between you and us. Our failure to exercise or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. These Legal Terms operate to the fullest extent permissible by law. We may assign any or all of our rights and obligations to others at any time. If any provision or part of a provision of these Legal Terms is determined to be unlawful, void, or unenforceable, that provision or part of the provision is deemed severable from these Legal Terms and does not affect the validity and enforceability of any remaining provisions. There is no joint venture, partnership, employment or agency relationship created between you and us as a result of these Legal Terms or use of the Services.</div>

<div style="line-height:1.5"><br></div>
<div id="contact" data-custom-class="heading_1" style="line-height:1.5"><strong><h2>26. CONTACT US</h2></strong></div>
<div data-custom-class="body_text" style="line-height:1.5">In order to resolve a complaint regarding the Services or to receive further information regarding use of the Services, please contact us at:</div>
<div style="line-height:1.5"><br></div>
<div data-custom-class="body_text" style="line-height:1.5"><strong>Chenyi Yang</strong><br>Houston, TX, United States<br><a href="mailto:stava.ziyi@gmail.com" data-custom-class="link">stava.ziyi@gmail.com</a></div>
`
