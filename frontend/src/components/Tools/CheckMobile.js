import { useEffect, useState } from "react";

export default function CheckMobile() {
  const [isMobile, setIsMobile] = useState(false);
  

  const CheckMobile = () => {
    setIsMobile(window.matchMedia("(max-width: 900px)").matches);
  };

  useEffect(() => {
    CheckMobile();
    window.addEventListener("resize", CheckMobile);
    return () => {
      window.removeEventListener("resize", CheckMobile);
    };
  }, []);

  return isMobile;
}
