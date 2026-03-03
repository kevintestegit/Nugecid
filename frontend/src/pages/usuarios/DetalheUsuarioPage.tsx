import React from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

import UserDetailModal from "@/components/usuarios/UserDetailModal";

const DetalheUsuarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);

  if (!Number.isFinite(numericId) || numericId <= 0) {
    return <Navigate to="/404" replace />;
  }

  return (
    <UserDetailModal
      userId={numericId}
      onClose={() => navigate("/usuarios", { replace: true })}
    />
  );
};

export default DetalheUsuarioPage;
