import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authService } from "@/services/authService";
import { LogOut, LayoutDashboard, Settings, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";

interface UserMenuProps {
	fullName: string | null;
	email: string | null;
	avatarUrl?: string | null;
	isAdmin?: boolean;
}

export function UserMenu({ fullName, email, avatarUrl, isAdmin = false }: UserMenuProps) {
	const navigate = useNavigate();
	const [isLoggingOut, setIsLoggingOut] = useState(false);

	const initials = fullName
		? fullName
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: email
			? email[0].toUpperCase()
			: "U";

	const handleSignOut = async () => {
		setIsLoggingOut(true);
		try {
			authService.logout();
			toast.success("Signed out successfully");
			navigate("/");
		} catch (error) {
			console.error("Sign out error:", error);
			toast.error("Failed to sign out");
		} finally {
			setIsLoggingOut(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button 
					variant="ghost" 
					className="relative h-10 w-10 rounded-full p-0 hover:ring-2 hover:ring-accent/50 transition-all"
				>
					<Avatar className="h-9 w-9 border-2 border-white/20">
						{avatarUrl && <AvatarImage src={avatarUrl} alt={fullName || "User"} />}
						<AvatarFallback className="bg-accent text-accent-foreground text-sm font-semibold">
							{initials}
						</AvatarFallback>
					</Avatar>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						{fullName && (
							<p className="text-sm font-medium leading-none">{fullName}</p>
						)}
						{email && (
							<p className="text-xs leading-none text-muted-foreground truncate">
								{email}
							</p>
						)}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link to="/dashboard" className="flex items-center gap-2 cursor-pointer">
						<LayoutDashboard className="w-4 h-4" />
						Dashboard
					</Link>
				</DropdownMenuItem>
				{isAdmin && (
					<DropdownMenuItem asChild>
						<Link to="/admin" className="flex items-center gap-2 cursor-pointer text-accent">
							<Shield className="w-4 h-4" />
							Admin Suite
						</Link>
					</DropdownMenuItem>
				)}
				<DropdownMenuItem asChild>
					<Link to="/dashboard?tab=settings" className="flex items-center gap-2 cursor-pointer">
						<Settings className="w-4 h-4" />
						Settings
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem 
					onClick={handleSignOut} 
					disabled={isLoggingOut}
					className="text-destructive focus:text-destructive cursor-pointer"
				>
					{isLoggingOut ? (
						<Loader2 className="w-4 h-4 mr-2 animate-spin" />
					) : (
						<LogOut className="w-4 h-4 mr-2" />
					)}
					Sign Out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
