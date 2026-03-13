import { Button, Card, Spinner } from "flowbite-react";
import { MdCancel } from "react-icons/md";
import { TbBrandGoogleDrive } from "react-icons/tb";
import {
  grantAccessToGoogleDrive,
  revokeAccessToGoogleDrive,
} from "../../services/authService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function GoogleDriveAction() {
  const queryClient = useQueryClient();

  const { refetch, isFetching: isGranting } = useQuery({
    queryKey: ["grant_access"],
    queryFn: grantAccessToGoogleDrive,
    enabled: false,
  });

  const handleAccess = async () => {
    const { data: result } = await refetch();

    if (result?.authUrl) {
      window.open(result.authUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handelRevokeAccess = useMutation({
    mutationFn: revokeAccessToGoogleDrive,
    onSuccess: (data) => {
      console.log(data);
      if (data?.success === true) {
        queryClient.invalidateQueries({ queryKey: ["google_drive_status"] });
      }
    },
    onError: (error) => {
      console.error("Revocation failed:", error);
    },
  });

  return (
    <Card>
      <h2 className="text-lg font-medium dark:text-neutral-100">
        Google Drive Access
      </h2>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <Button
          onClick={handleAccess}
          disabled={isGranting}
          className="bg-emerald-100 text-emerald-500 hover:bg-emerald-500 hover:text-neutral-100 md:col-span-6"
        >
          {isGranting ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <TbBrandGoogleDrive size={24} />
          )}
          Grant Access
        </Button>

        <Button
          onClick={() => handelRevokeAccess.mutate()}
          disabled={handelRevokeAccess.isPending}
          className="hover:bg-red-50 hover:text-red-500 md:col-span-6"
          color="alternative"
        >
          {handelRevokeAccess.isPending ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <MdCancel color="red" size={24} />
          )}
          Revoke Access
        </Button>
      </div>
    </Card>
  );
}
