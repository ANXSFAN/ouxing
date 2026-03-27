"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AttributeForm } from "@/components/admin/attribute-form";
import { Loader2 } from "lucide-react";

export default function EditAttributePage() {
  const params = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/attributes/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-slate-300" /></div>;
  }

  return <AttributeForm initialData={data!} />;
}
