import { Link, useLocation } from "react-router-dom";
import { Home, Search, LayoutDashboard, Calculator, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const navItems = [
	{ href: "/", icon: Home, label: "Home" },
	{ href: "/occupation-search", icon: Search, label: "Search" },
	{ href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
	{ href: "/points-calculator", icon: Calculator, label: "Points" },
	{ href: "/auth", icon: User, label: "Profile" },
];

export function MobileBottomNav() {
	const location = useLocation();

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
			{/* Blur backdrop */}
			<div className="absolute inset-0 gradient-navy backdrop-blur-lg" />
      
			{/* Safe area padding for iOS */}
			<div className="relative flex items-center justify-around px-2 pb-safe pt-2">
				{navItems.map((item) => {
					const isActive = location.pathname === item.href;
          
					return (
						<Link
							key={item.href}
							to={item.href}
							className={cn(
								"relative flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all duration-200",
								isActive 
									? "text-white" 
									: "text-white/60 hover:text-white/80"
							)}
						>
							{/* Active indicator */}
							{isActive && (
								<motion.div
									layoutId="activeTab"
									className="absolute inset-0 rounded-xl bg-white/10"
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
								/>
							)}
              
							<item.icon 
								className={cn(
									"relative z-10 h-5 w-5 transition-transform",
									isActive && "scale-110"
								)} 
							/>
							<span 
								className={cn(
									"relative z-10 text-[10px] font-medium",
									isActive && "text-accent"
								)}
							>
								{item.label}
							</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}
