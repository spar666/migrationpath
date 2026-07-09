import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

const footerLinks = {
	pathways: [
		{ label: "Skilled Migration", href: "/pathways/skilled" },
		{ label: "Regional Programs", href: "/pathways/regional" },
		{ label: "Student Visa", href: "/pathways/student" },
		{ label: "Partner Visa", href: "/pathways/partner" },
	],
	resources: [
		{ label: "Points Calculator", href: "/points-calculator" },
		{ label: "2026 Priority Occupation Lists", href: "/occupations" },
		{ label: "Migration News", href: "/news" },
		{ label: "FAQ", href: "/faq" },
	],
	company: [
		{ label: "About Us", href: "/about" },
		{ label: "Contact", href: "/contact" },
		{ label: "Privacy Policy", href: "/privacy" },
		{ label: "Terms of Service", href: "/terms" },
	],
};

const socialLinks = [
	{ icon: Facebook, href: "#", label: "Facebook" },
	{ icon: Twitter, href: "#", label: "Twitter" },
	{ icon: Linkedin, href: "#", label: "LinkedIn" },
	{ icon: Instagram, href: "#", label: "Instagram" },
];

export function Footer() {
	const { config: siteConfig } = useSiteConfig();
	const footerConfig = siteConfig?.footer;

	return (
		<footer className="gradient-navy border-t border-navy-light/20">
			<div className="container px-4 py-14 md:px-6 md:py-18">
				<div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
					{/* Brand Column */}
					<div className="space-y-5">
						<Link to="/" className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">
								<span className="text-lg font-bold text-white">M</span>
							</div>
							<span className="text-lg font-bold text-white tracking-tight">
								MigrationPath
							</span>
						</Link>
						<p className="text-sm text-glacier leading-relaxed">
							Your trusted partner for Australian migration pathways. We help you navigate the journey to permanent residency.
						</p>
						<div className="flex gap-3">
							{socialLinks.map((social) => (
								<a
									key={social.label}
									href={social.href}
									className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-glacier border border-white/10 transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-white/20"
									aria-label={social.label}
								>
									<social.icon className="h-4 w-4" />
								</a>
							))}
						</div>
					</div>

					{/* Pathways Column */}
					<div className="space-y-5">
						<h4 className="text-xs font-semibold text-glacier uppercase tracking-luxury">Pathways</h4>
						<ul className="space-y-3">
							{footerLinks.pathways.map((link) => (
								<li key={link.label}>
									<Link
										to={link.href}
										className="text-sm text-white/70 transition-colors hover:text-white"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Resources Column */}
					<div className="space-y-5">
						<h4 className="text-xs font-semibold text-glacier uppercase tracking-luxury">Resources</h4>
						<ul className="space-y-3">
							{footerLinks.resources.map((link) => (
								<li key={link.label}>
									<Link
										to={link.href}
										className="text-sm text-white/70 transition-colors hover:text-white"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Company Column */}
					<div className="space-y-5">
						<h4 className="text-xs font-semibold text-glacier uppercase tracking-luxury">Company</h4>
						<ul className="space-y-3">
							{footerLinks.company.map((link) => (
								<li key={link.label}>
									<Link
										to={link.href}
										className="text-sm text-white/70 transition-colors hover:text-white"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* MARA Compliance Statement */}
				<div className="mt-12 p-6 rounded-xl bg-white/5 border border-white/10">
					<div className="flex items-start gap-4">
						<div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
							<span className="text-xl font-bold text-accent">M</span>
						</div>
						<div>
							<h4 className="text-sm font-semibold text-white mb-2">MARA Registered Migration Services</h4>
							<p className="text-xs text-white/60 leading-relaxed">
								{footerConfig?.maraStatement || 
								  "Migration advice is provided by registered migration agents under the Office of the Migration Agents Registration Authority (OMARA). MARN verification available upon request. All recommendations comply with the Migration Act 1958 and 2026 regulatory updates."
								}
							</p>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
					<p className="text-sm text-white/60">
						© {new Date().getFullYear()} MigrationPath.com.au. All rights reserved.
					</p>
					<div className="flex items-center gap-4">
						<Link to="/occupations" className="text-xs text-accent hover:text-accent/80 transition-colors">
							2026 Priority Occupation Lists
						</Link>
						<span className="text-white/20">|</span>
						<p className="text-xs text-white/40">
							This information is general in nature and not legal advice.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}
