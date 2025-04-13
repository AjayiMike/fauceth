import Faucet from "@/components/Faucet";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Toaster } from "sonner";

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <Faucet />
            </main>
            <Toaster />
            <Footer />
        </div>
    );
}
