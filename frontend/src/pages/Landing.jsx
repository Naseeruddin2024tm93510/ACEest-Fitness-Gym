import React from 'react'
import { Link } from 'react-router-dom'

export default function Landing() {
    return (
        <div className="page">
            {/* Hero */}
            <div className="hero-section">
                <nav className="hero-nav">
                    <div className="logo">ACE<span>est</span></div>
                    <div className="nav-links">
                        <Link to="/login">Login</Link>
                        <Link to="/login" className="cta">Join Now</Link>
                    </div>
                </nav>
                <div className="hero-content">
                    <h1>Transform Your <span className="gold">Body</span>,<br />Transform Your <span className="gold">Life</span></h1>
                    <p>Premium fitness coaching, personalized training programs, expert nutrition guidance, and real-time progress tracking — all powered by our intelligent platform.</p>
                    <div className="hero-btns">
                        <Link to="/register" className="btn btn-gold">Get Started Free</Link>
                        <Link to="/login" className="btn btn-outline">Member Login</Link>
                    </div>
                </div>
            </div>

            {/* Features */}
            <section className="features-section">
                <h2>Why Choose <span className="gold">ACEest</span>?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="icon">🏋️</div>
                        <h3>Custom Workouts</h3>
                        <p>Weekly personalized training programs crafted by certified fitness professionals tailored to your exact goals.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">🥗</div>
                        <h3>Nutrition Plans</h3>
                        <p>Scientifically backed diet plans covering every meal — breakfast through post-workout — with precise calorie targets.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">📊</div>
                        <h3>Progress Analytics</h3>
                        <p>Track weight, body fat, waist measurements, and workout adherence with detailed historical data visualization.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">💬</div>
                        <h3>Direct Communication</h3>
                        <p>Real-time feedback loop between you and your trainer. Share concerns, request modifications, get instant coaching.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">🔄</div>
                        <h3>Flexible Trainer Selection</h3>
                        <p>Not satisfied? Request a trainer change anytime. Our admin team ensures a smooth transition to a better fit.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">📱</div>
                        <h3>Anywhere Access</h3>
                        <p>Access your workout plans, diet schedules, and progress metrics from any device, anywhere, anytime.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">🏆</div>
                        <h3>Competition Prep</h3>
                        <p>Specialized competition-level coaching with peak week programming, posing guidance, and stage preparation.</p>
                    </div>
                    <div className="feature-card">
                        <div className="icon">🛡️</div>
                        <h3>Secure Platform</h3>
                        <p>Role-based access control ensures your data stays private. Only your trainer and admin can view your profile.</p>
                    </div>
                </div>
            </section>

            {/* Plans */}
            <section className="plans-section">
                <h2>Membership <span className="gold">Plans</span></h2>
                <div className="plans-grid">
                    <div className="plan-card">
                        <h3>General</h3>
                        <p className="price">₹999<span>/mo</span></p>
                        <ul>
                            <li>Full gym facility access</li>
                            <li>Basic workout templates</li>
                            <li>Progress tracking dashboard</li>
                            <li>Community support forum</li>
                        </ul>
                    </div>
                    <div className="plan-card featured">
                        <div className="badge">Most Popular</div>
                        <h3>With Trainer</h3>
                        <p className="price">₹2,499<span>/mo</span></p>
                        <ul>
                            <li>Dedicated personal trainer</li>
                            <li>Custom weekly workout plans</li>
                            <li>Personalized diet plan</li>
                            <li>Weekly progress check-ins</li>
                            <li>Direct trainer messaging</li>
                        </ul>
                    </div>
                    <div className="plan-card">
                        <h3>Advanced Trainer</h3>
                        <p className="price">₹4,999<span>/mo</span></p>
                        <ul>
                            <li>Elite certified trainer</li>
                            <li>Advanced periodization</li>
                            <li>Detailed nutrition coaching</li>
                            <li>Body composition analysis</li>
                            <li>Monthly plan adjustments</li>
                        </ul>
                    </div>
                    <div className="plan-card">
                        <h3>Competition</h3>
                        <p className="price">₹9,999<span>/mo</span></p>
                        <ul>
                            <li>Competition prep specialist</li>
                            <li>Peak week programming</li>
                            <li>Posing & stage coaching</li>
                            <li>24/7 trainer availability</li>
                            <li>Supplement guidance</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="testimonials">
                <h2>What Our <span className="gold">Members</span> Say</h2>
                <div className="testimonial-grid">
                    <div className="testimonial-card">
                        <div className="stars">★★★★★</div>
                        <p className="quote">"ACEest completely transformed my fitness journey. My trainer designed a perfect program that helped me lose 15kg in 4 months. The progress tracking kept me accountable every single day."</p>
                        <p className="author">— Rahul Sharma, Member since 2024</p>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">★★★★★</div>
                        <p className="quote">"As a competitive bodybuilder, I needed specialized coaching. The Competition plan gave me exactly that. My trainer's peak week protocol was flawless. Best investment I've ever made."</p>
                        <p className="author">— Priya Patel, Competition Winner</p>
                    </div>
                    <div className="testimonial-card">
                        <div className="stars">★★★★★</div>
                        <p className="quote">"The diet plans are incredibly detailed and easy to follow. I love being able to message my trainer directly whenever I have questions. The whole platform feels very professional."</p>
                        <p className="author">— Arjun Reddy, Member since 2025</p>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 60px', textAlign: 'center', background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.08), transparent 70%)' }}>
                <h2 style={{ fontSize: 36, marginBottom: 16 }}>Ready to Start Your <span className="gold">Transformation</span>?</h2>
                <p style={{ color: 'var(--muted)', marginBottom: 32, fontSize: 16 }}>Join thousands of members who have already achieved their fitness goals with ACEest.</p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                    <Link to="/register" className="btn btn-gold">Register as Client</Link>
                    <Link to="/trainer-register" className="btn btn-outline">Register as Trainer</Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <p>© 2025 ACEest Fitness & Gym. All rights reserved. | Designed for peak performance.</p>
            </footer>
        </div>
    )
}
