import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Privacy Policy</h1>
      
      <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4 text-sm text-gray-500">Last Updated: June 1, 2023</p>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Introduction</h2>
          <p className="mb-3">
            At EventMaster, we respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website and tell you about your privacy rights and how the law protects you.
          </p>
          <p>
            Please read this privacy policy carefully before using our services. By using our services, you consent to the practices described in this policy.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
          <p className="mb-3">We may collect, use, store, and transfer different kinds of personal data about you, which we have grouped together as follows:</p>
          
          <ul className="list-disc pl-6 mb-3 space-y-2">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier, and date of birth.</li>
            <li><strong>Contact Data</strong> includes email address, telephone numbers, and physical address.</li>
            <li><strong>Financial Data</strong> includes payment card details (stored securely through our payment processors).</li>
            <li><strong>Transaction Data</strong> includes details about payments to and from you and other details of services you have purchased from us.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location, browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access our website.</li>
            <li><strong>Profile Data</strong> includes your username and password, purchases or orders made by you, your interests, preferences, feedback, and survey responses.</li>
            <li><strong>Usage Data</strong> includes information about how you use our website and services.</li>
            <li><strong>Marketing and Communications Data</strong> includes your preferences in receiving marketing from us and our third parties and your communication preferences.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
          <p className="mb-3">We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          
          <ul className="list-disc pl-6 mb-3 space-y-2">
            <li>To register you as a new customer.</li>
            <li>To process and deliver your orders.</li>
            <li>To manage our relationship with you.</li>
            <li>To enable you to participate in features of our services.</li>
            <li>To administer and protect our business and website.</li>
            <li>To deliver relevant website content and advertisements to you.</li>
            <li>To use data analytics to improve our website, products/services, marketing, customer relationships, and experiences.</li>
            <li>To make suggestions and recommendations to you about goods or services that may be of interest to you.</li>
          </ul>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Data Security</h2>
          <p className="mb-3">
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
          </p>
          <p>
            We have put in place procedures to deal with any suspected personal data breach and will notify you and any applicable regulator of a breach where we are legally required to do so.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
          <p>
            We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements. To determine the appropriate retention period for personal data, we consider the amount, nature, and sensitivity of the personal data, the potential risk of harm from unauthorized use or disclosure of your personal data, the purposes for which we process your personal data, and whether we can achieve those purposes through other means, and the applicable legal requirements.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Your Legal Rights</h2>
          <p className="mb-3">
            Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:
          </p>
          
          <ul className="list-disc pl-6 mb-3 space-y-2">
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing your personal data.</li>
            <li>Request transfer of your personal data.</li>
            <li>Right to withdraw consent.</li>
          </ul>
          
          <p>
            If you wish to exercise any of these rights, please contact us using the details provided below.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Cookies</h2>
          <p>
            Our website uses cookies to distinguish you from other users of our website. This helps us to provide you with a good experience when you browse our website and also allows us to improve our site. For detailed information on the cookies we use and the purposes for which we use them, see our Cookie Policy.
          </p>
        </section>
        
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Changes to This Privacy Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page and updating the "Last Updated" date at the top of this policy. You are advised to review this privacy policy periodically for any changes.
          </p>
        </section>
        
        <section>
          <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
          <p className="mb-3">
            If you have any questions about this privacy policy or our privacy practices, please contact us at:
          </p>
          
          <div className="bg-gray-100 p-4 rounded">
            <p>Email: privacy@eventmaster.com</p>
            <p>Phone: (123) 456-7890</p>
            <p>Address: 123 Event Street, Suite 456, New York, NY 10001</p>
          </div>
        </section>
      </div>
      
      <div className="max-w-3xl mx-auto mt-8 text-center">
        <p>
          For more information about our services, please visit our <Link to="/terms" className="text-blue-600 hover:text-blue-800">Terms of Service</Link> or <Link to="/contact" className="text-blue-600 hover:text-blue-800">contact us</Link>.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;