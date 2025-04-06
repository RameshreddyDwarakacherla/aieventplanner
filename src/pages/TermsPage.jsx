import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Terms of Service</h1>
      
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4 text-sm text-gray-500">Last Updated: June 1, 2023</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
          <p className="mb-3">
            Welcome to EventPlanner. These Terms of Service ("Terms") govern your use of our website, services, and applications (collectively, the "Services"). By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
          </p>
          <p>
            Please read these Terms carefully before using our Services. By using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">2. Definitions</h2>
          <p className="mb-3">In these Terms:</p>
          
          <ul className="list-disc pl-6 mb-3 space-y-2">
            <li>"EventMaster," "we," "us," and "our" refer to EventMaster, Inc.</li>
            <li>"User," "you," and "your" refer to the individual or entity using our Services.</li>
            <li>"Event Organizer" refers to a User who creates and manages events on our platform.</li>
            <li>"Vendor" refers to a User who offers services for events through our platform.</li>
            <li>"Content" refers to any information, text, graphics, photos, or other materials uploaded, downloaded, or appearing on our Services.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
          <p className="mb-3">
            To access certain features of our Services, you may be required to register for an account. When you register, you agree to provide accurate, current, and complete information about yourself. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
          </p>
          <p>
            We reserve the right to suspend or terminate your account if any information provided during registration or thereafter proves to be inaccurate, false, or misleading, or if you violate any provision of these Terms.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">4. User Conduct</h2>
          <p className="mb-3">You agree not to use our Services to:</p>
          
          <ul className="list-disc pl-6 mb-3 space-y-2">
            <li>Violate any applicable law, regulation, or these Terms.</li>
            <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity.</li>
            <li>Interfere with or disrupt the Services or servers or networks connected to the Services.</li>
            <li>Collect or store personal data about other users without their consent.</li>
            <li>Upload, post, or otherwise transmit any Content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable.</li>
            <li>Upload, post, or otherwise transmit any Content that infringes any patent, trademark, trade secret, copyright, or other proprietary rights of any party.</li>
            <li>Upload, post, or otherwise transmit any unsolicited or unauthorized advertising, promotional materials, "junk mail," "spam," "chain letters," "pyramid schemes," or any other form of solicitation.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">5. Content</h2>
          <p className="mb-3">
            You retain ownership of any Content you submit, post, or display on or through our Services. By submitting, posting, or displaying Content on or through our Services, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display, and distribute such Content in any and all media or distribution methods.
          </p>
          <p className="mb-3">
            You represent and warrant that you have all the rights, power, and authority necessary to grant the rights granted herein to any Content that you submit. You also represent and warrant that your Content does not infringe or violate the rights of any third party.
          </p>
          <p>
            We reserve the right to remove any Content that violates these Terms or that we find objectionable for any reason, without prior notice.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">6. Payments and Fees</h2>
          <p className="mb-3">
            Some of our Services may require payment of fees. All fees are stated in U.S. dollars unless otherwise specified. You agree to pay all fees and charges incurred in connection with your account at the rates in effect when the charges were incurred.
          </p>
          <p className="mb-3">
            We may change our fees and payment policies at any time. If we make a material change to our fees or payment policies, we will provide notice of the change on our website or by email. Your continued use of our Services after the fee change becomes effective constitutes your agreement to pay the changed amount.
          </p>
          <p>
            All payments are processed through secure third-party payment processors. We do not store your payment information on our servers.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">7. Termination</h2>
          <p className="mb-3">
            We may terminate or suspend your access to all or part of our Services, without notice, for any conduct that we, in our sole discretion, believe is in violation of these Terms or is harmful to other users, us, or third parties, or for any other reason.
          </p>
          <p>
            You may terminate your account at any time by following the instructions on our website. Upon termination, your right to use our Services will immediately cease.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">8. Disclaimer of Warranties</h2>
          <p>
            OUR SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT OUR SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE, THAT DEFECTS WILL BE CORRECTED, OR THAT OUR SERVICES OR THE SERVERS THAT MAKE THEM AVAILABLE ARE FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
          <p>
            IN NO EVENT SHALL WE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (I) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE OUR SERVICES; (II) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON OUR SERVICES; (III) ANY CONTENT OBTAINED FROM OUR SERVICES; AND (IV) UNAUTHORIZED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT, WHETHER BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), OR ANY OTHER LEGAL THEORY, WHETHER OR NOT WE HAVE BEEN INFORMED OF THE POSSIBILITY OF SUCH DAMAGE.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">10. Changes to These Terms</h2>
          <p>
            We may revise these Terms from time to time. The most current version will always be posted on our website. If a revision, in our sole discretion, is material, we will notify you via email or through our Services. By continuing to access or use our Services after those revisions become effective, you agree to be bound by the revised Terms.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
          <p className="mb-3">
            If you have any questions about these Terms, please contact us at:
          </p>
          
          <div className="bg-gray-100 p-4 rounded">
            <p>Email: legal@eventmaster.com</p>
            <p>Phone: (123) 456-7890</p>
            <p>Address: 123 Event Street, Suite 456, New York, NY 10001</p>
          </div>
        </section>
      </div>
      
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <p>
          For more information about how we protect your privacy, please visit our <Link to="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link> or <Link to="/contact" className="text-blue-600 hover:text-blue-800">contact us</Link>.
        </p>
      </div>
    </div>
  );
};

export default TermsPage;