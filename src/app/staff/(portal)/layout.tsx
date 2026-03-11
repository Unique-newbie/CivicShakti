import { StaffSidebarAuth } from "@/components/StaffSidebarAuth";
import { StaffAuthGuard } from "@/components/StaffAuthGuard";
import { Inter } from "next/font/google";
import { StaffLayoutShell } from "@/components/StaffLayoutShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "Authority Dashboard | CivicShakti",
    description: "Manage and resolve citizen complaints efficiently.",
};

export default function StaffLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={inter.className}>
            <StaffAuthGuard>
                <StaffLayoutShell sidebarAuth={<StaffSidebarAuth />}>
                    {children}
                </StaffLayoutShell>
            </StaffAuthGuard>
        </div>
    );
}
