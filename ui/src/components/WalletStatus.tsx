import {
  useCurrentAccount,
  useSuiClientQuery,
  useSignAndExecuteTransaction,
  useSuiClient,
} from "@mysten/dapp-kit";
import { Flex, Text, Card, Badge, Button, TextField } from "@radix-ui/themes";
import { useState } from "react";
import { useNetworkVariable } from "../networkConfig";
import { transferAdminCap } from "../utility/helpers/transfer_admin_cap";
import { validateSuiAddress } from "../utility/helpers/address_validation";

export function WalletStatus() {
  const account = useCurrentAccount();
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const [transferAdminAddress, setTransferAdminAddress] = useState("");
  const [isTransferringAdmin, setIsTransferringAdmin] = useState(false);
  const [addressError, setAddressError] = useState("");
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const { data: balance } = useSuiClientQuery(
    "getBalance",
    {
      owner: account?.address as string,
    },
    {
      enabled: !!account,
    },
  );

  // Check if user has AdminCap
  const { data: adminCap } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: account?.address as string,
      filter: {
        StructType: `${packageId}::marketplace::AdminCap`,
      },
      options: {
        showContent: true,
        showType: true,
      },
    },
    {
      enabled: !!account && !!packageId,
    },
  );

  const isAdmin = (adminCap?.data?.length ?? 0) > 0;
  const adminCapId = adminCap?.data?.[0]?.data?.objectId;

  const handleTransferAdmin = () => {
    const validation = validateSuiAddress(transferAdminAddress);

    if (!validation.isValid) {
      setAddressError(validation.error);
      return;
    }

    if (!isAdmin || !adminCapId) return;

    setAddressError("");
    setIsTransferringAdmin(true);

    const tx = transferAdminCap(adminCapId, transferAdminAddress);
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: async ({ digest }) => {
          await suiClient.waitForTransaction({
            digest,
            options: {
              showEffects: true,
            },
          });
          setIsTransferringAdmin(false);
          setTransferAdminAddress("");
          setAddressError("");
        },
        onError: () => {
          setIsTransferringAdmin(false);
        },
      },
    );
  };

  if (!account) {
    return (
      <Card>
        <Text>Please connect your wallet to continue</Text>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="4">
      <Card>
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            <Text size="4" weight="bold">
              Wallet Status
            </Text>
            {isAdmin && (
              <Badge color="red" size="2">
                ADMIN
              </Badge>
            )}
          </Flex>
          <Text>Address: {account.address}</Text>
          <Text>
            Balance:{" "}
            {balance
              ? Number(balance.totalBalance) / 1_000_000_000
              : "Loading..."}{" "}
            SUI
          </Text>
        </Flex>
      </Card>

      {/* Admin Cap Transfer Section */}
      {isAdmin && (
        <Card>
          <Flex direction="column" gap="3">
            <Text size="4" weight="bold" color="red">
              Admin Controls
            </Text>
            <Text size="2" color="gray">
              Transfer admin capabilities to another address. This action will
              remove your admin privileges.
            </Text>

            <Flex direction="column" gap="2">
              <TextField.Root
                placeholder="Enter admin address (0x...)"
                value={transferAdminAddress}
                onChange={(e) => {
                  setTransferAdminAddress(e.target.value);
                  setAddressError(""); // Clear error when user types
                }}
              />
              {addressError && (
                <Text size="2" color="red">
                  {addressError}
                </Text>
              )}
              <Button
                onClick={handleTransferAdmin}
                disabled={!transferAdminAddress.trim() || isTransferringAdmin}
                loading={isTransferringAdmin}
                color="red"
              >
                {isTransferringAdmin
                  ? "Transferring Admin..."
                  : "Transfer Admin Rights"}
              </Button>
            </Flex>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
