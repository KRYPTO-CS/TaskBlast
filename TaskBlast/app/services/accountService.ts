import { httpsCallable } from "firebase/functions";
import { functions } from "../../server/firebase";

interface DeleteChildAccountResponse {
  success: boolean;
  childDocId?: string;
  message?: string;
}

export const deleteChildAccount = async (payload: {
  childDocId: string;
}): Promise<DeleteChildAccountResponse> => {
  const callable = httpsCallable<typeof payload, DeleteChildAccountResponse>(
    functions,
    "deleteChildAccount",
  );

  const result = await callable(payload);
  return result.data;
};
