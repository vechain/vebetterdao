// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IPassportModule {
  /**
   * Returns the score of a user.
   *
   * @param _user The address of the user to get the score for.
   */
  //   function getScore(address _user) external view returns (uint256);
  /**
   * Returns the normalized score of a user. The score will be normalized to a 0-100 range.
   *
   * @param _user The address of the user to get the normalized score for.
   */
  //   function getNormalizedScore(address _user) external view returns (uint256);
}
