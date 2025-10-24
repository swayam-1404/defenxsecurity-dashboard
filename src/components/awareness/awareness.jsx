import React, { useState } from 'react';
import './awareness.css';

// Enhanced Data for the threats
const cyberThreats = [
    {
        id: 1,
        title: "1. Phishing 🎣",
        description: "Deceptive attempts to acquire sensitive information (usernames, passwords, credit card details) by disguising as a trustworthy entity (like a bank, retailer, or IT support) in an electronic communication, typically email or text.",
        example: "You receive an email from 'Netflix Security' saying your payment failed and asking you to click a link to 'verify your billing details.' The link leads to a fake website that steals your login credentials.",
        protection: [
            "Inspect the Sender: Check the email address for misspellings or unusual domains (e.g., 'amaz0n.com' instead of 'amazon.com').",
            "Hover, Don't Click: Before clicking a link, hover over it to see the actual destination URL in the corner of your browser/email client.",
            "Never Give Credentials: Legitimate companies rarely ask for passwords via email or chat. If suspicious, navigate directly to the official site."
        ]
    },
    {
        id: 2,
        title: "2. Malware (Virus/Trojan) 🦠",
        description: "Malicious software, including viruses, worms, and Trojans, designed to cause damage, gain unauthorized access, steal data, or disrupt computer systems. It often requires user interaction (like opening an infected file) to execute.",
        example: "You download a free screen saver or cracked software from a non-official website. Hidden inside this download is a Trojan horse that secretly installs a keylogger to record everything you type, including passwords.",
        protection: [
            "Use Anti-Virus/Anti-Malware Software: Keep it updated and run regular, full system scans.",
            "Be Selective: Only download software and files from trusted, official sources (App Stores, official company websites).",
            "Firewall: Ensure your operating system's firewall is enabled to block unauthorized network access."
        ]
    },
    {
        id: 3,
        title: "3. Ransomware 💸",
        description: "A type of malicious software that blocks access to your computer system or encrypts your files until a sum of money (a ransom) is paid to the attacker, usually in cryptocurrency like Bitcoin.",
        example: "An alert suddenly pops up on your screen, locking your desktop and displaying a timer, stating, 'All your documents, photos, and databases have been encrypted. Pay $500 in Bitcoin within 48 hours to receive the decryption key.'",
        protection: [
            "Backup Data: Regularly back up your essential data using the '3-2-1 rule' (3 copies, 2 different media types, 1 copy off-site/offline).",
            "Patch Systems: Keep your operating system and all applications fully updated to close security vulnerabilities.",
            "Isolate Networks: Segment your network to limit the spread if one computer gets infected."
        ]
    },
    {
        id: 4,
        title: "4. Password Attacks (Brute-Force) 🔑",
        description: "Methods used by automated tools to systematically guess or crack passwords. Brute-force tries every possible combination, while dictionary attacks try common words, names, and leaked passwords.",
        example: "An attacker uses a powerful cloud server to automatically try 10,000 common passwords per second against your company's login page until they successfully guess your weak password, 'Summer2025!', granting them access.",
        protection: [
            "Use Strong Passwords: Mix of uppercase, lowercase, numbers, and symbols (minimum 12+ characters). Avoid common words or personal information.",
            "Enable 2FA (Two-Factor Authentication): This requires a second verification code (usually from your phone) even if the password is known.",
            "Use a Password Manager: Safely store unique, complex passwords for all accounts so you don't have to remember them."
        ]
    },
    {
        id: 5,
        title: "5. Man-in-the-Middle (MITM) 📡",
        description: "An attack where the attacker secretly intercepts, relays, and possibly alters the communication between two parties who believe they are communicating directly and securely.",
        example: "You log onto a free public Wi-Fi hotspot at a coffee shop. The attacker is using a hidden device to reroute all traffic through their computer, capturing your banking login details as you type them into an unencrypted website.",
        protection: [
            "Avoid Public Wi-Fi: Do not use public or unsecure Wi-Fi for sensitive transactions (banking, shopping, email).",
            "Use a VPN: A Virtual Private Network encrypts your connection end-to-end, making MITM attacks ineffective.",
            "Look for HTTPS: Always ensure websites use HTTPS (Secure) and have a valid lock icon in the address bar."
        ]
    },
    {
        id: 6,
        title: "6. Social Engineering 👥",
        description: "The psychological manipulation of people into performing actions or divulging confidential information. This relies on human error, trust, urgency, or fear rather than technical hacking.",
        example: "An attacker calls your office pretending to be from the IT department, claiming there's an 'urgent security issue' and they 'need your password right now' to fix it before the system crashes. They exploit your helpful nature and urgency.",
        protection: [
            "Verify Identity: Hang up and call back the known, official number of the person or department making the request.",
            "Be Skeptical: Treat all unsolicited contact (calls, emails, chat) asking for sensitive information or access with extreme suspicion.",
            "Protect Personal Info: Limit what you share about your work, colleagues, and company processes online, especially on social media."
        ]
    },
];

const AwarenessPage = () => {
    // State to track which threat card is currently open/active
    const [activeThreatId, setActiveThreatId] = useState(0);

    const handleTitleClick = (id) => {
        // Toggle the active state
        setActiveThreatId(activeThreatId === id ? 0 : id);
    };

    return (
        <div className="awareness-page">
            <header>
                <h1>Cyber Security Awareness Center 🔒</h1>
                <p>Your guide to staying safe online and protecting digital assets.</p>
            </header>

            <main>
                <section className="threats-container">
                    <h2>Common Cyber Threats</h2>
                    
                    {/* Map through the threats data */}
                    {cyberThreats.map(threat => (
                        <div key={threat.id} className="threat-card">
                            <h3 
                                className="threat-title"
                                onClick={() => handleTitleClick(threat.id)}
                            >
                                {threat.title}
                            </h3>
                            <div 
                                className={`threat-content ${activeThreatId === threat.id ? 'active' : ''}`}
                            >
                                <h4>What is it? (Description)</h4>
                                <p>{threat.description}</p>

                                <h4>Concrete Example</h4>
                                <p><strong>Example:</strong> {threat.example}</p>

                                <h4>How to get Protected?</h4>
                                <ul>
                                    {threat.protection.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </section>
                
                {/* ---------------------------------------------------------------------------------- */}
                
                <section className="habits-section">
                    <h2>Simple Habits that Prevent 90% of Cyber Incidents:</h2>
                    <div className="habits-list">
                        <p>✅ <strong>Think before you click</strong> suspicious links or attachments.</p>
                        <p>🔒 Use <strong>strong passwords</strong> and enable <strong>2FA</strong> (two-factor authentication).</p>
                        <p>🧩 <strong>Never share credentials</strong> on email or chat.</p>
                        <p>📢 <strong>Report</strong> any strange emails or system behavior immediately.</p>
                        <p>🧑‍💻 <strong>Update all devices and apps</strong> regularly.</p>
                    </div>
                </section>
            </main>

            <footer>
                <p>&copy; Defenx Status: Online | Version: 1.0.0 | © 2025 Company</p>
            </footer>
        </div>
    );
};

export default AwarenessPage;