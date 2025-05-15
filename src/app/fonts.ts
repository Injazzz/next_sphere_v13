import { Pacifico, Poppins } from "next/font/google";

// Konfigurasi font Pacifico
export const pacifico = Pacifico({
  weight: "400", // Pacifico hanya tersedia dalam weight 400
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pacifico",
});

export const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
});
