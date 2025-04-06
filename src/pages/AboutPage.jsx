import React from 'react';

const AboutPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">About EventMaster</h1>
      
      <section className="mb-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="mb-4">
          At EventMaster, our mission is to simplify the event planning process by providing a comprehensive platform that connects event organizers with vendors and offers powerful tools to manage every aspect of your event.
        </p>
        <p>
          We believe that everyone should be able to create memorable events without the stress and complexity that often comes with planning. Our platform is designed to make event planning accessible, efficient, and enjoyable.
        </p>
      </section>
      
      <section className="mb-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
        <p className="mb-4">
          EventMaster was founded in 2023 by a team of event planning professionals who recognized the need for a better way to organize events. After years of experiencing the challenges of event planning firsthand, our founders set out to create a solution that would address the pain points they had encountered.
        </p>
        <p>
          What started as a simple tool for managing guest lists has evolved into a comprehensive platform that handles everything from vendor selection to budget management. Today, EventMaster is trusted by thousands of event planners worldwide.
        </p>
      </section>
      
      <section className="mb-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
        <p className="mb-4">
          Behind EventMaster is a dedicated team of professionals with diverse backgrounds in event planning, technology, and customer service. We're united by our passion for creating exceptional user experiences and our commitment to helping our customers succeed.
        </p>
        <p>
          Our team is constantly working to improve our platform, adding new features and refining existing ones based on user feedback. We believe in the power of collaboration and are always open to suggestions from our community.
        </p>
      </section>
      
      <section className="mb-10 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">User-Centered Design</h3>
            <p>We put our users at the center of everything we do, creating intuitive and accessible experiences that meet their needs.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Innovation</h3>
            <p>We're constantly exploring new ideas and technologies to improve our platform and provide innovative solutions to event planning challenges.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Quality</h3>
            <p>We're committed to delivering a high-quality product that meets the highest standards of reliability, security, and performance.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-2">Community</h3>
            <p>We believe in the power of community and strive to foster connections between event planners, vendors, and attendees.</p>
          </div>
        </div>
      </section>
      
      <section className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Join Us on Our Journey</h2>
        <p className="mb-6">
          We're just getting started, and we're excited about the future of EventMaster. Whether you're an event planner, a vendor, or an attendee, we invite you to join us on our journey to revolutionize the event planning industry.
        </p>
        <a 
          href="/contact" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 inline-block"
        >
          Get in Touch
        </a>
      </section>
    </div>
  );
};

export default AboutPage;