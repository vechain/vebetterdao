// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import '@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol';
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "./interfaces/IERC20.sol";
import "./interfaces/IERC721.sol";
import  "./interfaces/IVOT3.sol";

contract Treasury is IERC721Receiver, Initializable, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    bytes32 public constant TIMELOCK_ROLE = keccak256("TIMELOCK_ROLE");
    bytes32 public constant PROXY_ADMIN_ROLE = keccak256("PROXY_ADMIN_ROLE");
    address public constant VTHO = 0x0000000000000000000000000000456E65726779;
    address public B3TR;
    address public VOT3;

    /// @notice The address of the proxy admin
    address private admin;

    modifier onlyAdmin() {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Treasury: caller is not an executor");
        _;
    }

    modifier onlyTimelockWhenNotPaused() {
        require(hasRole(TIMELOCK_ROLE, _msgSender()), "Treasury: caller is not timelock executor");
        require(!paused(), "Treasury: contract is paused");
        _;
    }

    modifier onlyProxyAdmin() {
        require(hasRole(PROXY_ADMIN_ROLE, msg.sender), "Treasury: caller is not the proxy admin");
        _;
    }

    /**
     * @notice Initialize the contract
     * @param _b3tr the address of the B3TR token
     * @param _vot3 the address of the VOT3 token
     * @param _timeLock the address of the timelock contract
     * @param _admin the address of the proxy admin
     */
    function initialize(address _b3tr, address _vot3, address _timeLock, address _admin, address _proxyAdmin) public initializer {
        B3TR = _b3tr;
        VOT3 = _vot3;

        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TIMELOCK_ROLE, _timeLock);
        _grantRole(PROXY_ADMIN_ROLE, _proxyAdmin);
    }

    receive() external payable {}
    
    fallback() external payable {}

    /**
     * @notice Pause the contract
     */
    function pause() public onlyAdmin {
        _pause();
    }

    /**
     * @notice Unpause the contract
     */
    function unpause() public onlyAdmin {
        _unpause();
    }

    /**
     * @notice transfer VTHO to a given address
     * @param _to the address to transfer VTHO to
     * @param _value the amount of VTHO to transfer
     */
    function transferVTHO(address _to, uint256 _value) public onlyTimelockWhenNotPaused{
        IERC20 vtho = _getERC20Contract(VTHO);
        require(vtho.balanceOf(address(this)) >= _value, "Treasury: insufficient VTHO balance");
        vtho.transfer(_to, _value);
    }

    /**
     * @notice transfer B3TR to a given address
     * @param _to the address to transfer B3TR to
     * @param _value the amount of B3TR to transfer
     */
    function transferB3TR(address _to, uint256 _value) public onlyTimelockWhenNotPaused {
        IERC20 b3tr = _getERC20Contract(B3TR);
        require(b3tr.balanceOf(address(this)) >= _value, "Treasury: insufficient B3TR balance");
        b3tr.transfer(_to, _value);
    }

    /**
     * @notice transfer VOT3 to a given address
     * @param _to the address to transfer VOT3 to
     * @param _value the amount of VOT3 to transfer
     */
    function transferVOT3(address _to, uint256 _value) public onlyTimelockWhenNotPaused{
        IERC20 vot3 = _getERC20Contract(VOT3);
        require(vot3.balanceOf(address(this)) >= _value, "Treasury: insufficient VOT3 balance");
        vot3.transfer(_to, _value);
    }

    /**
     * @notice transfer VET to a given address
     * @param _to the address to transfer VET to
     * @param _value the amount of VET to transfer
     */
    function transferVET(address _to, uint256 _value) public onlyTimelockWhenNotPaused{
        require(address(this).balance >= _value, "Treasury: insufficient VET balance");
        payable(_to).transfer(_value);
    }

    /**
     * @notice transfer any ERC20 token to a given address
     * @param _token the address of the ERC20 token to transfer
     * @param _to the address to transfer the ERC20 token to
     * @param _value the amount of ERC20 token to transfer
     */
    function transferTokens(address _token, address _to, uint256 _value) public onlyTimelockWhenNotPaused {
        IERC20 token = _getERC20Contract(_token);
        require(token.balanceOf(address(this)) >= _value, "Treasury: insufficient balance");
        token.transfer(_to, _value);
    }

    /**
     * @notice transfer any ERC721 token to a given address
     * @param _nft the address of the ERC721 token to transfer
     * @param _to the address to transfer the ERC721 token to
     * @param _tokenId the id of the ERC721 token to transfer
     */
    function transferNFT(address _nft, address _to, uint256 _tokenId) public onlyTimelockWhenNotPaused{
        IERC721 nft = IERC721(_nft);
        require(nft.ownerOf(_tokenId) == address(this), "Treasury: dao does not own the NFT");
        nft.safeTransferFrom(address(this), _to, _tokenId);
    }

    /**
     * @notice stake B3TR to VOT3
     * @param _b3trAmount the amount of B3TR to stake
     */
    function stakeB3TR(uint256 _b3trAmount) public onlyTimelockWhenNotPaused {
        IERC20 b3tr = _getERC20Contract(B3TR);
        IVOT3 vot3 = IVOT3(VOT3);
        require(b3tr.balanceOf(address(this)) >= _b3trAmount, "Treasury: insufficient B3TR balance");
        require(b3tr.approve(VOT3, _b3trAmount), "Treasury: approval for VOT3 failed");
        vot3.stake(_b3trAmount);
    }

    /**
     * @notice unstake B3TR from VOT3
     * @param __vot3Amount the amount of VOT3 to unstake
     */
    function unstakeB3TR(uint256 __vot3Amount) public onlyTimelockWhenNotPaused {
        IVOT3 vot3 = IVOT3(VOT3);
        require(vot3.stakedBalanceOf(address(this)) >= __vot3Amount, "Treasury: insufficient B3TR staked");
        vot3.unstake(__vot3Amount);
    }

    // ---------- Getters ---------- //
    function getVTHOBalance() public view returns (uint256) {
        IERC20 vtho = _getERC20Contract(VTHO);
        return vtho.balanceOf(address(this));
    }

    function getB3TRBalance() public view returns (uint256) {
        IERC20 b3tr = _getERC20Contract(B3TR);
        return b3tr.balanceOf(address(this));
    }

    function getVOT3Balance() public view returns (uint256) {
        IERC20 vot3 = _getERC20Contract(VOT3);
        return vot3.balanceOf(address(this));
    }

    function getVETBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice get the balance of any ERC20 token
     * @param _token the address of the ERC20 token
     */
    function getTokenBalance(address _token) public view returns (uint256) {
        IERC20 token = _getERC20Contract(_token);
        return token.balanceOf(address(this));
    }

    /**
     * @notice get the balance of any ERC721 token
     * @param _nft the address of the ERC721 token
     */
    function getCollectionNFTBalance(address _nft) public view returns (uint256) {
        IERC721 nft = IERC721(_nft);
        return nft.balanceOf(address(this));
    }

    /**
    * @notice get the version of the contract
    */
    function getVersion() public pure virtual returns (string memory) {
        return "V1";
    }

    // ----------- Internal & Private ----------- //

    // @dev Get the ERC20 contract instance
    function _getERC20Contract(address token) internal pure returns (IERC20) {
        return IERC20(token);
    }
    
    // ---------- Overrides ---------- //
    // @dev See {IERC721Receiver-onERC721Received}.
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // @dev See {UUPSUpgradeable-_authorizeUpgrade}.
    function _authorizeUpgrade(address newImplementation) internal virtual override onlyProxyAdmin {}
}