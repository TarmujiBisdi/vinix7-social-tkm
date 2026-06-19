import { useEffect, useState } from "react";
import { getComments, getSettings } from "@/lib/store";
import { SocialComment, Settings } from "@/lib/types";

export const useComments = () => {
  const [comments, setComments] = useState<SocialComment[]>([]);
  useEffect(() => {
    const sync = () => setComments(getComments());
    sync();
    window.addEventListener("vsa-data-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("vsa-data-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return comments;
};

export const useSettings = () => {
  const [s, setS] = useState<Settings>(getSettings());
  useEffect(() => {
    const sync = () => setS(getSettings());
    window.addEventListener("vsa-data-change", sync);
    return () => window.removeEventListener("vsa-data-change", sync);
  }, []);
  return s;
};
