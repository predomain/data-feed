export const SeaportABI = [
  {
    type: "bytes32",
    name: "orderHash",
  },
  {
    type: "address",
    name: "recipient",
  },
  {
    type: "tuple[]",
    name: "offer",
    components: [
      {
        type: "uint8",
        name: "itemType",
      },
      {
        type: "address",
        name: "token",
      },
      {
        type: "uint256",
        name: "identifier",
      },
      {
        type: "uint256",
        name: "amount",
      },
    ],
  },
  {
    type: "tuple[]",
    name: "consideration",
    components: [
      {
        type: "uint8",
        name: "itemType",
      },
      {
        type: "address",
        name: "token",
      },
      {
        type: "uint256",
        name: "identifier",
      },
      {
        type: "uint256",
        name: "amount",
      },
      {
        type: "address",
        name: "recipient",
      },
    ],
  },
];
