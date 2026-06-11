import React, { useState } from "react";
import { Check, Zap, Users, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PRICING_TIERS = [
  {
    id: "free",
    name: "Starter",
    price: "Free",
    description: "Get started with AI music creation",
    features: [
      "3 tracks/month",
      "Basic Soulfire Engine",
      "Standard audio quality",
      "Community support",
      "DNA tagging included",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    id: "pro",
    name: "Sonance Pro",
    price: "$99",
    period: "/month",
    description: "Professional music production studio",
    features: [
      "Unlimited generation",
      "Full Soulfire Engine",
      "48KHz/24-bit studio quality",
      "All remix options (keep-lyrics, stems, variations, tempo)",
      "Blend mode (morph between versions)",
      "Commercial license included",
      "DNA tagging + micro-royalties",
      "Priority support",
      "Advanced vocal personas",
    ],
    cta: "Start Pro",
    featured: true,
    margin: "90% GROSS MARGIN",
  },
  {
    id: "studio",
    name: "Studio Bundle",
    price: "$299",
    period: "/month",
    description: "For serious producers & labels",
    features: [
      "Everything in Pro",
      "Team collaboration (5 users)",
      "Advanced analytics",
      "Custom genre templates",
      "Stem export + mastering",
      "Live session streaming",
      "API access",
      "Dedicated account manager",
      "Monthly genre drops",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

const PRODUCT_ADD_ONS = [
  {
    name: "SL Universal",
    price: "$4.99/mo",
    description: "Stream AI-generated music + discover creators",
    margin: "86% GROSS MARGIN",
    icon: "🎵",
  },
  {
    name: "Discord Bot",
    price: "$4.99-$19.99/mo",
    description: "Generate tracks in your server",
    margin: "98% GROSS MARGIN",
    icon: "🤖",
  },
  {
    name: "TikTok Card",
    price: "Free",
    description: "Shareable creator identity + viral growth",
    margin: "VIRAL ENGINE",
    icon: "📱",
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );

  const handleSelectPlan = (tierId: string) => {
    if (tierId === "studio") {
      // Open contact form or email
      window.location.href = "mailto:sales@lyrica3pro.com?subject=Studio+Bundle+Inquiry";
    } else {
      navigate("/studio");
    }
  };

  return (
    <div className="pricing-page">
      <style>{pricingStyles}</style>

      {/* Header */}
      <header className="pricing-header">
        <nav className="pricing-nav">
          <div className="nav-logo">
            <span className="logo-icon">🎵</span>
            LYRICA 3 PRO
          </div>
          <div className="nav-links">
            <a href="/" className="nav-link">Home</a>
            <button 
              className="nav-link login-btn"
              onClick={() => navigate("/studio")}
            >
              Sign In
            </button>
          </div>
        </nav>

        <div className="header-content">
          <h1>Simple, Transparent Pricing</h1>
          <p>Own your music. Keep 70% of revenue. No surprises.</p>
        </div>
      </header>

      {/* Billing Toggle */}
      <div className="billing-toggle-section">
        <div className="billing-toggle">
          <button
            className={`toggle-btn ${billingPeriod === "monthly" ? "active" : ""}`}
            onClick={() => setBillingPeriod("monthly")}
          >
            Monthly
          </button>
          <button
            className={`toggle-btn ${billingPeriod === "annual" ? "active" : ""}`}
            onClick={() => setBillingPeriod("annual")}
          >
            Annual <span className="save-badge">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Tiers */}
      <section className="pricing-tiers">
        <div className="tiers-container">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`pricing-card ${tier.featured ? "featured" : ""}`}
            >
              {tier.featured && <div className="featured-badge">MOST POPULAR</div>}

              <h3 className="tier-name">{tier.name}</h3>
              <p className="tier-description">{tier.description}</p>

              <div className="price-section">
                <div className="price">
                  <span className="amount">{tier.price}</span>
                  {tier.period && <span className="period">{tier.period}</span>}
                </div>
                {tier.margin && (
                  <p className="margin-tag">{tier.margin}</p>
                )}
              </div>

              <button
                className={`tier-cta ${tier.featured ? "primary" : "secondary"}`}
                onClick={() => handleSelectPlan(tier.id)}
              >
                {tier.cta}
              </button>

              <div className="features-list">
                {tier.features.map((feature, i) => (
                  <div key={i} className="feature-item">
                    <Check size={16} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add-ons */}
      <section className="add-ons-section">
        <h2>Enhance Your Experience</h2>
        <p className="section-subtitle">Expand your Lyrica 3 Pro with complementary products</p>

        <div className="add-ons-grid">
          {PRODUCT_ADD_ONS.map((addon, i) => (
            <div key={i} className="add-on-card">
              <span className="addon-icon">{addon.icon}</span>
              <h4>{addon.name}</h4>
              <p className="addon-price">{addon.price}</p>
              <p className="addon-description">{addon.description}</p>
              <span className="addon-margin">{addon.margin}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison-section">
        <h2>Feature Comparison</h2>
        <div className="comparison-table">
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Starter</th>
                <th>Sonance Pro</th>
                <th>Studio Bundle</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Monthly Generations</td>
                <td>3</td>
                <td>Unlimited</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td>Soulfire Engine Access</td>
                <td>Basic</td>
                <td>Full</td>
                <td>Full</td>
              </tr>
              <tr>
                <td>Audio Quality</td>
                <td>320kbps MP3</td>
                <td>48KHz/24-bit WAV</td>
                <td>48KHz/24-bit WAV</td>
              </tr>
              <tr>
                <td>Remix Options</td>
                <td>1</td>
                <td>4 (keep-lyrics, stems, variations, tempo)</td>
                <td>4 + Custom</td>
              </tr>
              <tr>
                <td>Blend Mode</td>
                <td>—</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Commercial License</td>
                <td>—</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>DNA Tagging</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Micro-Royalties (70/30)</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Team Collaboration</td>
                <td>—</td>
                <td>—</td>
                <td>5 users</td>
              </tr>
              <tr>
                <td>Support</td>
                <td>Community</td>
                <td>Priority</td>
                <td>Dedicated</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-grid">
          <div className="faq-item">
            <h4>Do I own the music I create?</h4>
            <p>
              Yes, 100% ownership. Every track gets a DNA tag (digital birth certificate) proving you created it.
            </p>
          </div>
          <div className="faq-item">
            <h4>How do I earn royalties?</h4>
            <p>
              When someone remixes or samples your track, micro-royalties are automatically distributed. You keep 70%, we take 30%.
            </p>
          </div>
          <div className="faq-item">
            <h4>Can I cancel anytime?</h4>
            <p>
              Yes, cancel your subscription anytime. Your tracks and DNA tags remain yours forever.
            </p>
          </div>
          <div className="faq-item">
            <h4>What's the difference between plans?</h4>
            <p>
              Starter: Learn the basics. Pro: Full studio access for creators. Studio: Team collaboration + advanced tools.
            </p>
          </div>
          <div className="faq-item">
            <h4>Is there a free trial?</h4>
            <p>
              Yes! Start free with 3 tracks/month. Upgrade anytime to Pro for unlimited generation.
            </p>
          </div>
          <div className="faq-item">
            <h4>Do you support my genre?</h4>
            <p>
              We have 20+ genre engines including Chicano Soul, Corrido, Souldies, R&B, Trap, and more.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta-pricing">
        <h2>Ready to Own Your Sound?</h2>
        <p>Join creators building the future of AI music.</p>
        <div className="cta-buttons">
          <button 
            className="btn-primary-large"
            onClick={() => navigate("/studio")}
          >
            Start Creating
          </button>
          <a href="/" className="btn-secondary-large">
            Learn More
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="pricing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h5>Product</h5>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/pricing">Pricing</a></li>
              <li><a href="/">Features</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h5>Company</h5>
            <ul>
              <li><a href="#">About</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h5>Legal</h5>
            <ul>
              <li><a href="#">Terms</a></li>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Contact</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h5>Connect</h5>
            <ul>
              <li><a href="#">Discord</a></li>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">Instagram</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Lyrica 3 Pro. All rights reserved. Built by Empire One.</p>
          <p className="universe-tag">SLA113 // UNIVERSE 1 — LYRICA3</p>
        </div>
      </footer>
    </div>
  );
}

const pricingStyles = `
  * {
    box-sizing: border-box;
  }

  .pricing-page {
    --pink: #ff1493;
    --pink-glow: rgba(255, 20, 147, 0.4);
    --pink-soft: rgba(255, 20, 147, 0.15);
    --pink-dim: rgba(255, 20, 147, 0.08);
    --bg: #050505;
    --bg-card: #0c0c0c;
    --border: rgba(255, 20, 147, 0.12);
    --border-hover: rgba(255, 20, 147, 0.3);
    --text: #f0f0f0;
    --text-dim: #888888;

    background: var(--bg);
    color: var(--text);
    font-family: 'Inter', -apple-system, sans-serif;
  }

  /* Header */
  .pricing-header {
    border-bottom: 1px solid var(--border);
    padding-bottom: 60px;
  }

  .pricing-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 40px;
    border-bottom: 1px solid var(--border);
  }

  .nav-logo {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.15em;
    color: var(--pink);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo-icon {
    font-size: 20px;
  }

  .nav-links {
    display: flex;
    gap: 24px;
    align-items: center;
  }

  .nav-link {
    background: transparent;
    border: none;
    color: var(--text-dim);
    font-size: 13px;
    cursor: pointer;
    text-decoration: none;
    transition: color 0.2s;
  }

  .nav-link:hover {
    color: var(--pink);
  }

  .login-btn {
    background: var(--pink-dim);
    border: 1px solid var(--border-hover);
    color: var(--pink);
    padding: 8px 16px;
    border-radius: 4px;
  }

  .login-btn:hover {
    border-color: var(--pink);
  }

  .header-content {
    padding: 80px 40px;
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
  }

  .header-content h1 {
    font-size: 48px;
    font-weight: 700;
    margin: 0 0 12px 0;
    line-height: 1.2;
  }

  .header-content p {
    font-size: 18px;
    color: var(--text-dim);
    margin: 0;
  }

  /* Billing Toggle */
  .billing-toggle-section {
    text-align: center;
    padding: 40px;
  }

  .billing-toggle {
    display: flex;
    gap: 12px;
    width: fit-content;
    margin: 0 auto;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 4px;
  }

  .toggle-btn {
    background: transparent;
    border: none;
    color: var(--text-dim);
    padding: 10px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 0.2s;
    position: relative;
  }

  .toggle-btn.active {
    background: var(--pink);
    color: #000;
  }

  .save-badge {
    background: var(--pink);
    color: #000;
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 10px;
    margin-left: 8px;
    font-weight: 700;
  }

  /* Pricing Tiers */
  .pricing-tiers {
    padding: 60px 40px;
  }

  .tiers-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .pricing-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 32px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    transition: all 0.3s;
    position: relative;
  }

  .pricing-card:hover {
    border-color: var(--border-hover);
    transform: translateY(-4px);
  }

  .pricing-card.featured {
    border-color: var(--pink);
    background: linear-gradient(135deg, var(--pink-dim) 0%, var(--bg-card) 50%);
    box-shadow: 0 0 24px var(--pink-glow);
  }

  .featured-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--pink);
    color: #000;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
  }

  .tier-name {
    font-size: 20px;
    font-weight: 700;
    margin: 0;
  }

  .tier-description {
    font-size: 13px;
    color: var(--text-dim);
    margin: 0;
  }

  .price-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .price {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .amount {
    font-size: 36px;
    font-weight: 700;
    color: var(--pink);
  }

  .period {
    font-size: 13px;
    color: var(--text-dim);
  }

  .margin-tag {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #d4a847;
    margin: 0;
  }

  .tier-cta {
    padding: 12px 24px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tier-cta.primary {
    background: var(--pink);
    color: #000;
  }

  .tier-cta.primary:hover {
    box-shadow: 0 0 20px var(--pink-glow);
    transform: translateY(-1px);
  }

  .tier-cta.secondary {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border-hover);
  }

  .tier-cta.secondary:hover {
    border-color: var(--pink);
    color: var(--pink);
    background: var(--pink-dim);
  }

  .features-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: auto;
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 13px;
    color: var(--text-dim);
  }

  .feature-item svg {
    color: var(--pink);
    flex-shrink: 0;
    margin-top: 2px;
  }

  /* Add-ons */
  .add-ons-section {
    padding: 60px 40px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .add-ons-section h2 {
    text-align: center;
    font-size: 32px;
    margin: 0 0 12px 0;
  }

  .section-subtitle {
    text-align: center;
    color: var(--text-dim);
    margin: 0 0 40px 0;
  }

  .add-ons-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .add-on-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.2s;
  }

  .add-on-card:hover {
    border-color: var(--pink);
    background: var(--pink-dim);
  }

  .addon-icon {
    font-size: 40px;
  }

  .add-on-card h4 {
    font-size: 16px;
    margin: 0;
  }

  .addon-price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    color: var(--pink);
    margin: 0;
  }

  .addon-description {
    font-size: 12px;
    color: var(--text-dim);
    margin: 0;
  }

  .addon-margin {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #d4a847;
  }

  /* Comparison Table */
  .comparison-section {
    padding: 60px 40px;
  }

  .comparison-section h2 {
    text-align: center;
    font-size: 32px;
    margin: 0 0 40px 0;
  }

  .comparison-table {
    overflow-x: auto;
    max-width: 100%;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
  }

  thead {
    background: var(--pink-dim);
  }

  th {
    padding: 16px;
    text-align: left;
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    border-bottom: 1px solid var(--border);
  }

  td {
    padding: 16px;
    font-size: 13px;
    border-bottom: 1px solid var(--border);
  }

  tbody tr:hover {
    background: rgba(255, 20, 147, 0.05);
  }

  /* FAQ */
  .faq-section {
    padding: 60px 40px;
    background: var(--bg-card);
  }

  .faq-section h2 {
    text-align: center;
    font-size: 32px;
    margin: 0 0 40px 0;
  }

  .faq-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 24px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .faq-item {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 20px;
  }

  .faq-item h4 {
    font-size: 14px;
    margin: 0 0 12px 0;
    color: var(--text);
  }

  .faq-item p {
    font-size: 13px;
    color: var(--text-dim);
    margin: 0;
    line-height: 1.6;
  }

  /* Final CTA */
  .final-cta-pricing {
    padding: 80px 40px;
    text-align: center;
  }

  .final-cta-pricing h2 {
    font-size: 40px;
    margin: 0 0 12px 0;
  }

  .final-cta-pricing p {
    font-size: 18px;
    color: var(--text-dim);
    margin: 0 0 32px 0;
  }

  .cta-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .btn-primary-large,
  .btn-secondary-large {
    padding: 16px 40px;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }

  .btn-primary-large {
    background: var(--pink);
    color: #000;
  }

  .btn-primary-large:hover {
    box-shadow: 0 0 20px var(--pink-glow);
    transform: translateY(-2px);
  }

  .btn-secondary-large {
    background: transparent;
    color: var(--text);
    border: 1px solid var(--border-hover);
  }

  .btn-secondary-large:hover {
    border-color: var(--pink);
    color: var(--pink);
    background: var(--pink-dim);
  }

  /* Footer */
  .pricing-footer {
    background: var(--bg-card);
    border-top: 1px solid var(--border);
    padding: 40px;
  }

  .footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 32px;
    max-width: 1200px;
    margin: 0 auto 32px;
  }

  .footer-section h5 {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin: 0 0 16px 0;
    color: var(--text);
  }

  .footer-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .footer-section a {
    font-size: 12px;
    color: var(--text-dim);
    text-decoration: none;
    transition: color 0.2s;
  }

  .footer-section a:hover {
    color: var(--pink);
  }

  .footer-bottom {
    text-align: center;
    border-top: 1px solid var(--border);
    padding-top: 24px;
  }

  .footer-bottom p {
    font-size: 12px;
    color: var(--text-muted);
    margin: 0;
  }

  .universe-tag {
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.05em;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .header-content {
      padding: 60px 20px;
    }

    .header-content h1 {
      font-size: 32px;
    }

    .tiers-container {
      grid-template-columns: 1fr;
    }

    .nav-links {
      gap: 12px;
    }

    .cta-buttons {
      flex-direction: column;
      gap: 12px;
    }

    .btn-primary-large,
    .btn-secondary-large {
      width: 100%;
    }

    .footer-content {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;
