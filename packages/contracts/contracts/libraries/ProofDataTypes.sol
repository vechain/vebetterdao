// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

library ProofDataTypes {
  struct Proof {
    string[] types; // link, photo, video, etc.
    string[] values; // "https://...", "Qm...", etc.
  }

  struct Impact {
    string[] codes; // carbon, water, etc.
    uint256[] values; // 100, 200, etc.
  }
}
