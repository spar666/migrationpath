import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, Calculator, LayoutDashboard, FileText, ChevronDown, GraduationCap, Briefcase, Heart, Building2, UserCheck, Home, Newspaper, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuoteSlideOver } from "@/components/quote/QuoteSlideOver";
import { UserMenu } from "@/components/common/navbar/UserMenu";
import { authService } from "@/services/authService";
import { cn } from "@/lib/utils";

const navLinks = [
	{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ label: "Points Calculator", href: "/points-calculator", icon: Calculator },
	{ label: "Occupation Search", href: "/occupation-search", icon: Search },
	{ label: "Migration News", href: "/news", icon: Newspaper },
];

const pathwayCategories = [
	{
		label: "For Students",
		description: "Study & transition to PR",
		icon: GraduationCap,
		href: "/pathways/student",
	},
	{
		label: "For Skilled Professionals",
		description: "Direct skilled migration",
		icon: Briefcase,
		href: "/pathways/skilled",
	},
	{
		label: "Onshore Professionals",
		description: "Already in Australia? Maximize points",
		icon: UserCheck,
		href: "/pathways/onshore",
	},
	{
		label: "For Partners & Families",
		description: "Join your loved ones",
		icon: Heart,
		href: "/pathways/partner",
	},
	{
		label: "Employer Sponsored",
		description: "Sponsored by employers",
		icon: Building2,
		href: "/pathways/employer",
	},
];

interface HeaderProfile {
	full_name: string | null;
	email: string | null;
	is_admin: boolean | null;
}

function useScrollState(threshold = 10) {
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > threshold);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [threshold]);
	return scrolled;
}

export function Header() {
	const location = useLocation();
	const scrolled = useScrollState();
	const [isOpen, setIsOpen] = useState(false);
	const [quoteOpen, setQuoteOpen] = useState(false);
	const [profile, setProfile] = useState<HeaderProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;
		const fetchProfile = async () => {
			try {
				if (!authService.isAuthenticated()) {
					if (isMounted) setIsLoading(false);
					return;
				}
				const user = await authService.me();
				if (user && isMounted) {
					setProfile({
						full_name: user.fullName || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null),
						email: user.email,
						is_admin: user.isAdmin || false,
					});
				}
			} catch { } finally {
				if (isMounted) setIsLoading(false);
			}
		};
		fetchProfile();
		return () => { isMounted = false; };
	}, []);

	const isAdminPage = location.pathname.startsWith("/admin");
	const isAuthenticated = !!profile;
	const visibleLinks = navLinks.filter((l) => l.label !== "Dashboard" || isAuthenticated);

	const containerVariants = {
		hidden: { opacity: 0, y: -20 },
		visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.06 } },
	};

	const itemVariants = {
		hidden: { opacity: 0, y: -12 },
		visible: { opacity: 1, y: 0 },
	};

	return (
		<>
			<motion.header
				initial="hidden"
				animate="visible"
				variants={containerVariants}
				className={cn(
					"sticky top-0 z-50 w-full transition-all duration-500",
					scrolled
						? "bg-navy/80 backdrop-blur-xl shadow-[0_1px_30px_-10px_rgba(0,0,0,0.5)] border-b border-white/5"
						: "gradient-navy border-b border-white/5"
				)}
			>
				{/* Subtle accent border glow */}
				<div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

				<div className="container flex h-16 items-center justify-between px-4 md:px-6">
					{/* Logo */}
					<motion.div variants={itemVariants}>
						<Link to="/" className="flex items-center gap-3 group" title="Back to Home">
							<div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 transition-all duration-300 group-hover:bg-white/15 group-hover:border-accent/30 group-hover:shadow-[0_0_15px_-3px_rgba(198,161,91,0.3)]">
								<Sparkles className="w-4 h-4 text-accent group-hover:scale-110 transition-all duration-300" />
							</div>
							<span className="hidden text-lg font-bold text-white sm:inline-block tracking-tight">
								Migration
								<span className="text-accent">Path</span>
							</span>
						</Link>
					</motion.div>

					{/* Desktop Navigation */}
					{!isAdminPage && (
						<motion.nav
							variants={containerVariants}
							className="hidden items-center gap-1 md:flex"
						>
							{/* Pathways Dropdown */}
							<motion.div variants={itemVariants}>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<button className="group relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white/60 transition-all duration-300 hover:text-white hover:bg-white/[0.08] hover:shadow-[0_0_20px_-8px_rgba(198,161,91,0.2)]">
											Pathways
											<ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
										</button>
									</DropdownMenuTrigger>
									<DropdownMenuContent
										align="start"
										className="w-64 bg-navy/95 backdrop-blur-xl border border-white/10 shadow-2xl z-50"
									>
										<DropdownMenuLabel className="text-xs font-semibold uppercase tracking-widest text-white/40">
											Choose Your Path
										</DropdownMenuLabel>
										<DropdownMenuSeparator className="bg-white/5" />
										{pathwayCategories.map((category) => (
											<DropdownMenuItem key={category.label} asChild>
												<Link
													to={category.href}
													className="flex items-start gap-3 p-3 cursor-pointer group/item"
												>
													<div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 transition-colors group-hover/item:bg-accent/20">
														<category.icon className="w-4 h-4 text-white/50 group-hover/item:text-accent transition-colors" />
													</div>
													<div>
														<p className="font-medium text-white/90 group-hover/item:text-white transition-colors">{category.label}</p>
														<p className="text-xs text-white/40">{category.description}</p>
													</div>
												</Link>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</motion.div>

							{/* Nav links with animated active indicator */}
							{visibleLinks.map((link) => {
								const isActive = location.pathname === link.href;
								return (
									<motion.div key={link.label} variants={itemVariants} className="relative">
										<Link
											to={link.href}
											className={cn(
												"relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300",
												isActive
													? "text-white"
													: "text-white/60 hover:text-white hover:bg-white/[0.08]"
											)}
										>
											<link.icon className="w-4 h-4" />
											{link.label}
										</Link>
										{isActive && (
											<motion.div
												layoutId="nav-indicator"
												className="absolute -bottom-[1px] left-2 right-2 h-[2px] bg-accent rounded-full"
												transition={{ type: "spring", stiffness: 400, damping: 30 }}
											/>
										)}
									</motion.div>
								);
							})}

							{/* Get Quote */}
							<motion.div variants={itemVariants}>
								<button
									onClick={() => setQuoteOpen(true)}
									className="group relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/60 transition-all duration-300 hover:text-white hover:bg-white/[0.08]"
								>
									<FileText className="w-4 h-4" />
									Get Quote
								</button>
							</motion.div>
						</motion.nav>
					)}

					{/* Desktop Right Actions */}
					<motion.div variants={itemVariants} className="hidden items-center gap-3 md:flex">
						{!isAdminPage && (
							<Button
								variant="ghost"
								size="icon"
								className="relative h-10 w-10 rounded-lg text-white/50 hover:text-white hover:bg-white/[0.08] transition-all duration-300"
							>
								<Search className="h-4 w-4" />
								<span className="sr-only">Search</span>
							</Button>
						)}

						{!isLoading && (
							isAuthenticated ? (
								<motion.div
									initial={{ scale: 0.8, opacity: 0 }}
									animate={{ scale: 1, opacity: 1 }}
									transition={{ type: "spring", stiffness: 300, damping: 20 }}
								>
									<UserMenu
										fullName={profile?.full_name || null}
										email={profile?.email || null}
										isAdmin={profile?.is_admin === true}
									/>
								</motion.div>
							) : (
								<Link to="/auth?intent=login">
									<Button
										variant="outline"
										className="relative h-10 rounded-lg border-accent/40 bg-transparent text-white/90 transition-all duration-300 hover:bg-accent/10 hover:border-accent hover:text-white hover:shadow-[0_0_25px_-5px_rgba(198,161,91,0.4)] overflow-hidden group"
									>
										<span className="relative z-10">Log In</span>
										<div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-accent/0 via-accent/[0.07] to-accent/0 transition-transform duration-500" />
									</Button>
								</Link>
							)
						)}
					</motion.div>

					{/* Mobile Menu Trigger */}
					<motion.div variants={itemVariants} className="md:hidden">
						<Sheet open={isOpen} onOpenChange={setIsOpen}>
							<SheetTrigger asChild>
								<Button variant="ghost" size="icon" className="h-10 w-10 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
									<Menu className="h-5 w-5" />
									<span className="sr-only">Toggle menu</span>
								</Button>
							</SheetTrigger>
							<SheetContent side="right" className="w-[300px] p-0 bg-navy/95 backdrop-blur-xl border-l border-white/10">
								<div className="flex h-full flex-col">
									<div className="flex items-center justify-between border-b border-white/10 p-5">
										<span className="text-lg font-bold text-white">Menu</span>
										<SheetClose asChild>
											<Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-white/70 hover:text-white hover:bg-white/10">
												<X className="h-4 w-4" />
											</Button>
										</SheetClose>
									</div>

									<nav className="flex flex-col gap-1 p-4">
										<Link
											to="/"
											onClick={() => setIsOpen(false)}
											className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-accent transition-all duration-200 hover:bg-white/10"
										>
											<Home className="w-5 h-5" />
											Back to Home
										</Link>

										{!isAdminPage && (
											<>
												<div className="mb-4 mt-2">
													<p className="px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/40">
														Pathways
													</p>
													{pathwayCategories.map((category) => (
														<Link
															key={category.label}
															to={category.href}
															onClick={() => setIsOpen(false)}
															className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
														>
															<category.icon className="w-5 h-5 text-white/40" />
															{category.label}
														</Link>
													))}
												</div>

												<div className="border-t border-white/10 pt-4">
													{visibleLinks.map((link) => (
														<Link
															key={link.label}
															to={link.href}
															onClick={() => setIsOpen(false)}
															className="flex items-center gap-3 rounded-lg px-4 py-3.5 text-base font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
														>
															<link.icon className="w-5 h-5 text-white/40" />
															{link.label}
														</Link>
													))}
													<button
														onClick={() => { setIsOpen(false); setQuoteOpen(true); }}
														className="flex w-full items-center gap-3 rounded-lg px-4 py-3.5 text-base font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
													>
														<FileText className="w-5 h-5 text-white/40" />
														Get Quote
													</button>
												</div>
											</>
										)}
									</nav>

									<div className="mt-auto border-t border-white/10 p-5">
										{isAuthenticated ? (
											<div className="flex items-center gap-3">
												<UserMenu
													fullName={profile?.full_name || null}
													email={profile?.email || null}
													isAdmin={profile?.is_admin === true}
												/>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-white truncate">
														{profile?.full_name || profile?.email}
													</p>
													<p className="text-xs text-white/50">Signed in</p>
												</div>
											</div>
										) : (
											<Link to="/auth?intent=login" onClick={() => setIsOpen(false)}>
												<Button variant="outline" className="w-full h-11 rounded-lg border-white/20 bg-white/5 text-white hover:bg-white/10">
													Log In
												</Button>
											</Link>
										)}
									</div>
								</div>
							</SheetContent>
						</Sheet>
					</motion.div>
				</div>
			</motion.header>

			<QuoteSlideOver open={quoteOpen} onOpenChange={setQuoteOpen} />
		</>
	);
}
