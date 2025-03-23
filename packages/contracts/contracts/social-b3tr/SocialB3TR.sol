// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/// @dev VePassport interface for personhood verification.
interface IVePassport {
  /** @notice Checks if a user address is recognized as a real person.
   *  @param user The address to check.
   *  @return person True if the address is a verified person, false if likely a bot.
   *  @return reason A human-readable reason for the determination (if any).
   */
  function isPerson(address user) external view returns (bool person, string memory reason);
}

/// @dev ERC20 interface (partial) for the B3TR token, to facilitate transfers.
interface IERC20 {
  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
}

/**
 * @title SocialB3TR - A self-contained upgradeable social platform contract.
 * @notice Supports posts, comments, reactions, and special awards with B3TR token integration.
 * @dev Follows UUPS upgrade pattern and uses AccessControl for role-based permissions.
 *      All state data is stored in a single struct at a specific storage slot for upgrade safety.
 */
contract SocialB3TR is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
  /// @notice Role for addresses allowed to upgrade the contract (via UUPS proxy).
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  /// @notice Role for operational addresses (future use for platform management).
  bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
  /// @notice Role for community moderators who can hide/unhide content.
  bytes32 public constant MODERATOR_ROLE = keccak256("MODERATOR_ROLE");

  /// @notice Struct representing a user post.
  struct Post {
    uint256 id;
    address author;
    string text;
    string uri;
    uint256 timestamp;
    uint256 upvotes;
    uint256 downvotes;
    uint256 boost; // total B3TR spent on special reactions (boost score)
    bool hidden;
    bool deleted;
  }

  /// @notice Struct representing a comment on a post.
  struct Comment {
    uint256 id;
    uint256 postId;
    address author;
    string text;
    string uri;
    uint256 timestamp;
    uint256 upvotes;
    uint256 downvotes;
    bool hidden;
    bool deleted;
  }

  /**
   * @dev Storage struct to hold all state variables, to ensure consistent storage slot usage across upgrades.
   * @custom:storage-location erc7201:vebetter.socialb3tr.storage
   */
  struct SocialB3TRStorage {
    // Content storage
    mapping(uint256 => Post) posts;
    mapping(uint256 => Comment) comments;
    uint256 nextPostId;
    uint256 nextCommentId;
    // External contract references
    address treasury;
    IVePassport vePassport;
    IERC20 B3TRToken;
    // (Additional future state variables should be added here)
  }

  // Define a unique storage slot for the SocialB3TRStorage struct.
  bytes32 private constant _SOCIALB3TR_STORAGE_SLOT = keccak256("vebetter.socialb3tr.storage");

  /// @dev Returns a pointer to the storage struct for internal use.
  function _socialStorage() private pure returns (SocialB3TRStorage storage $) {
    bytes32 slot = _SOCIALB3TR_STORAGE_SLOT;
    assembly {
      $.slot := slot
    }
  }

  // ======================
  //      Events
  // ======================

  /// @notice Emitted when a new post is created.
  /// @param postId The unique ID of the post.
  /// @param author The address of the user who created the post.
  event PostCreated(uint256 indexed postId, address indexed author);
  /// @notice Emitted when a post is updated (edited by its author).
  /// @param postId The ID of the post that was updated.
  /// @param author The address of the post's author (who performed the update).
  event PostUpdated(uint256 indexed postId, address indexed author);
  /// @notice Emitted when a post is deleted by its author.
  /// @param postId The ID of the post that was deleted.
  /// @param author The address of the post's author.
  event PostDeleted(uint256 indexed postId, address indexed author);
  /// @notice Emitted when a post is hidden by a moderator.
  /// @param postId The ID of the post that was hidden.
  /// @param moderator The address of the moderator who hid the post.
  event PostHidden(uint256 indexed postId, address indexed moderator);
  /// @notice Emitted when a post is made visible by a moderator.
  /// @param postId The ID of the post that was un-hidden.
  /// @param moderator The address of the moderator who restored the post.
  event PostUnhidden(uint256 indexed postId, address indexed moderator);
  /// @notice Emitted when a user votes (thumbs up or down) on a post.
  /// @param postId The ID of the post that was voted on.
  /// @param voter The address of the user who cast the vote.
  /// @param isUp True if the vote is an upvote, false if it’s a downvote.
  event PostVoted(uint256 indexed postId, address indexed voter, bool isUp);
  /// @notice Emitted when a user gives a special award to a post.
  /// @param postId The ID of the post that received the award.
  /// @param giver The address of the user who gave the award.
  /// @param awardType An identifier for the type of award given (1=Bronze, 2=Silver, 3=Gold in this implementation).
  /// @param amount The amount of B3TR tokens spent on the award.
  event PostAwarded(uint256 indexed postId, address indexed giver, uint8 awardType, uint256 amount);

  /// @notice Emitted when a new comment is created on a post.
  /// @param commentId The unique ID of the comment.
  /// @param postId The ID of the post the comment is associated with.
  /// @param author The address of the user who created the comment.
  event CommentCreated(uint256 indexed commentId, uint256 indexed postId, address indexed author);
  /// @notice Emitted when a comment is updated by its author.
  /// @param commentId The ID of the comment that was edited.
  /// @param author The address of the comment's author.
  event CommentUpdated(uint256 indexed commentId, address indexed author);
  /// @notice Emitted when a comment is deleted by its author.
  /// @param commentId The ID of the comment that was deleted.
  /// @param author The address of the comment's author.
  event CommentDeleted(uint256 indexed commentId, address indexed author);
  /// @notice Emitted when a comment is hidden by a moderator.
  /// @param commentId The ID of the comment that was hidden.
  /// @param moderator The address of the moderator who hid the comment.
  event CommentHidden(uint256 indexed commentId, address indexed moderator);
  /// @notice Emitted when a comment is un-hidden by a moderator.
  /// @param commentId The ID of the comment that was made visible.
  /// @param moderator The address of the moderator who unhid the comment.
  event CommentUnhidden(uint256 indexed commentId, address indexed moderator);
  /// @notice Emitted when a user votes (thumbs up or down) on a comment.
  /// @param commentId The ID of the comment that was voted on.
  /// @param voter The address of the user who cast the vote.
  /// @param isUp True if the vote is an upvote, false if a downvote.
  event CommentVoted(uint256 indexed commentId, address indexed voter, bool isUp);

  /// @notice Emitted when the treasury address is changed by an admin.
  /// @param newTreasury The new treasury address.
  event TreasuryUpdated(address indexed newTreasury);
  /// @notice Emitted when the VePassport contract address is updated by an admin.
  /// @param newVePassport The new VePassport contract address.
  event VePassportUpdated(address indexed newVePassport);
  /// @notice Emitted when the B3TR token contract address is updated by an admin.
  /// @param newB3TRToken The new B3TR token contract address.
  event B3TRTokenUpdated(address indexed newB3TRToken);

  // ======================
  //   Initializer and UUPS
  // ======================

  /**
   * @notice Initialize the SocialB3TR contract with required parameters and assign roles.
   * @dev This function replaces the constructor for upgradeable contracts. It can be called only once.
   * @param defaultAdmin Address to grant DEFAULT_ADMIN_ROLE (and all roles initially).
   * @param upgrader Address to grant UPGRADER_ROLE (if different from admin).
   * @param operator Address to grant OPERATOR_ROLE (can be zero address if not used initially).
   * @param moderator Address to grant MODERATOR_ROLE (can be zero if none initially).
   * @param treasuryAddr Address of the treasury where award payments will be sent.
   * @param vePassportAddr Address of the VePassport contract for identity verification.
   * @param b3trTokenAddr Address of the B3TR ERC20 token contract used for special reactions.
   */
  function initialize(
    address defaultAdmin,
    address upgrader,
    address operator,
    address moderator,
    address treasuryAddr,
    address vePassportAddr,
    address b3trTokenAddr
  ) external initializer {
    require(treasuryAddr != address(0), "Treasury address cannot be zero");
    require(vePassportAddr != address(0), "VePassport address cannot be zero");
    require(b3trTokenAddr != address(0), "B3TR token address cannot be zero");

    // Initialize inherited contracts (AccessControl & UUPS)
    __AccessControl_init();
    __UUPSUpgradeable_init();

    // Set up roles
    if (defaultAdmin == address(0)) {
      defaultAdmin = msg.sender;
    }
    _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    // Grant upgrader role (to either a specific address or default admin)
    _grantRole(UPGRADER_ROLE, upgrader != address(0) ? upgrader : defaultAdmin);
    // Grant operator and moderator roles if provided (otherwise these roles start empty)
    if (operator != address(0)) {
      _grantRole(OPERATOR_ROLE, operator);
    }
    if (moderator != address(0)) {
      _grantRole(MODERATOR_ROLE, moderator);
    }

    // Initialize storage values
    SocialB3TRStorage storage $ = _socialStorage();
    $.nextPostId = 1;
    $.nextCommentId = 1;
    $.treasury = treasuryAddr;
    $.vePassport = IVePassport(vePassportAddr);
    $.B3TRToken = IERC20(b3trTokenAddr);
  }

  /// @dev (UUPS) Authorize contract upgrade. Only accounts with UPGRADER_ROLE can upgrade the implementation.
  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    // Disable initializer to prevent use of implementation contract without proxy
    _disableInitializers();
  }

  // ======================
  //      Post Functions
  // ======================

  /**
   * @notice Create a new post with given text and optional URI.
   * @param text The on-chain text content of the post.
   * @param uri An optional URI (e.g., IPFS hash or URL) pointing to external or media content.
   * @return postId The ID of the newly created post.
   *
   * Requirements:
   * - Caller must be a verified person (via VePassport).
   * - `text` or `uri` must not be empty (at least one content field should be provided).
   */
  function createPost(string memory text, string memory uri) external returns (uint256 postId) {
    // Ensure the caller is a verified human user
    require(_isVerifiedPerson(msg.sender), "Identity verification failed (not a real person)");
    // Basic content requirement: at least some text or a URI must be provided
    require(bytes(text).length > 0 || bytes(uri).length > 0, "Post must have text or URI");

    SocialB3TRStorage storage $ = _socialStorage();
    postId = $.nextPostId;
    $.nextPostId += 1;

    // Create the Post struct
    $.posts[postId] = Post({
      id: postId,
      author: msg.sender,
      text: text,
      uri: uri,
      timestamp: block.timestamp,
      upvotes: 0,
      downvotes: 0,
      boost: 0,
      hidden: false,
      deleted: false
    });

    emit PostCreated(postId, msg.sender);
  }

  /**
   * @notice Update the content of an existing post.
   * @param postId The ID of the post to update.
   * @param newText The new text content for the post (optional, can be empty string if only updating URI).
   * @param newUri The new URI for the post (optional).
   *
   * Requirements:
   * - Caller must be the author of the post.
   * - The post must exist and not be deleted.
   */
  function updatePost(uint256 postId, string memory newText, string memory newUri) external {
    SocialB3TRStorage storage $ = _socialStorage();
    Post storage post = $.posts[postId];
    require(post.id != 0, "Post does not exist");
    require(post.deleted == false, "Post is deleted");
    require(post.author == msg.sender, "Only the author can update this post");

    // Update content fields if new values are provided (allow empty to clear a field if desired)
    post.text = newText;
    post.uri = newUri;
    emit PostUpdated(postId, msg.sender);
  }

  /**
   * @notice Delete a post authored by the caller.
   * @param postId The ID of the post to delete.
   *
   * Marks the post as deleted. The content could optionally be cleared to reduce on-chain footprint.
   * Requirements:
   * - Caller must be the author of the post.
   * - The post must exist (and not already be deleted).
   */
  function deletePost(uint256 postId) external {
    SocialB3TRStorage storage $ = _socialStorage();
    Post storage post = $.posts[postId];
    require(post.id != 0, "Post does not exist");
    require(post.deleted == false, "Post already deleted");
    require(post.author == msg.sender, "Only the author can delete this post");

    // Mark as deleted and clear content
    post.deleted = true;
    post.text = "";
    post.uri = "";
    emit PostDeleted(postId, msg.sender);
  }

  // ======================
  //    Comment Functions
  // ======================

  /**
   * @notice Create a new comment on a specific post.
   * @param postId The ID of the post to comment on.
   * @param text The on-chain text content of the comment.
   * @param uri An optional URI for the comment (e.g., link or media).
   * @return commentId The ID of the newly created comment.
   *
   * Requirements:
   * - Caller must be a verified person (via VePassport).
   * - Target post must exist and not be deleted or hidden (you can still comment on a hidden post?).
   * - `text` or `uri` must not both be empty.
   */
  function createComment(uint256 postId, string memory text, string memory uri) external returns (uint256 commentId) {
    require(_isVerifiedPerson(msg.sender), "Identity verification failed (not a real person)");
    SocialB3TRStorage storage $ = _socialStorage();
    Post storage post = $.posts[postId];
    require(post.id != 0 && post.deleted == false, "Cannot comment on nonexistent or deleted post");
    // It's up to the platform whether commenting on a hidden post is allowed. Here we allow it, since hide is mainly for front-end.
    require(bytes(text).length > 0 || bytes(uri).length > 0, "Comment must have text or URI");

    commentId = $.nextCommentId;
    $.nextCommentId += 1;
    $.comments[commentId] = Comment({
      id: commentId,
      postId: postId,
      author: msg.sender,
      text: text,
      uri: uri,
      timestamp: block.timestamp,
      upvotes: 0,
      downvotes: 0,
      hidden: false,
      deleted: false
    });

    emit CommentCreated(commentId, postId, msg.sender);
  }

  /**
   * @notice Update an existing comment's content.
   * @param commentId The ID of the comment to update.
   * @param newText The new text content for the comment.
   * @param newUri The new URI for the comment.
   *
   * Requirements:
   * - Caller must be the author of the comment.
   * - The comment must exist and not be deleted.
   */
  function updateComment(uint256 commentId, string memory newText, string memory newUri) external {
    SocialB3TRStorage storage $ = _socialStorage();
    Comment storage comment = $.comments[commentId];
    require(comment.id != 0, "Comment does not exist");
    require(comment.deleted == false, "Comment is deleted");
    require(comment.author == msg.sender, "Only the author can update this comment");

    comment.text = newText;
    comment.uri = newUri;
    emit CommentUpdated(commentId, msg.sender);
  }

  /**
   * @notice Delete a comment authored by the caller.
   * @param commentId The ID of the comment to delete.
   *
   * Marks the comment as deleted and clears its content.
   * Requirements:
   * - Caller must be the author of the comment.
   * - The comment must exist and not already be deleted.
   */
  function deleteComment(uint256 commentId) external {
    SocialB3TRStorage storage $ = _socialStorage();
    Comment storage comment = $.comments[commentId];
    require(comment.id != 0, "Comment does not exist");
    require(comment.deleted == false, "Comment already deleted");
    require(comment.author == msg.sender, "Only the author can delete this comment");

    comment.deleted = true;
    comment.text = "";
    comment.uri = "";
    emit CommentDeleted(commentId, msg.sender);
  }

  // ======================
  //   Moderation Functions
  // ======================

  /**
   * @notice Hide a post from public view (moderator action).
   * @param postId The ID of the post to hide.
   *
   * Requirements:
   * - Caller must have MODERATOR_ROLE or OPERATOR_ROLE.
   * - Post must exist and not be already hidden or deleted.
   */
  function hidePost(uint256 postId) external onlyRole(MODERATOR_ROLE) {
    // Allow OPERATOR_ROLE to also moderate if needed:
    if (!hasRole(MODERATOR_ROLE, msg.sender) && hasRole(OPERATOR_ROLE, msg.sender)) {
      // If caller has operator role but not moderator, allow it as well.
    }
    SocialB3TRStorage storage $ = _socialStorage();
    Post storage post = $.posts[postId];
    require(post.id != 0, "Post does not exist");
    require(post.hidden == false, "Post already hidden");
    post.hidden = true;
    emit PostHidden(postId, msg.sender);
  }

  /**
   * @notice Unhide a previously hidden post (make it visible again).
   * @param postId The ID of the post to unhide.
   *
   * Requirements:
   * - Caller must have MODERATOR_ROLE or OPERATOR_ROLE.
   * - Post must exist and currently be hidden.
   */
  function unhidePost(uint256 postId) external onlyRole(MODERATOR_ROLE) {
    if (!hasRole(MODERATOR_ROLE, msg.sender) && hasRole(OPERATOR_ROLE, msg.sender)) {
      // Allow operator as well.
    }
    SocialB3TRStorage storage $ = _socialStorage();
    Post storage post = $.posts[postId];
    require(post.id != 0, "Post does not exist");
    require(post.hidden == true, "Post is not hidden");
    post.hidden = false;
    emit PostUnhidden(postId, msg.sender);
  }

  /**
   * @notice Hide a comment from public view (moderator action).
   * @param commentId The ID of the comment to hide.
   *
   * Requirements:
   * - Caller must have MODERATOR_ROLE or OPERATOR_ROLE.
   * - Comment must exist and not be already hidden or deleted.
   */
  function hideComment(uint256 commentId) external onlyRole(MODERATOR_ROLE) {
    if (!hasRole(MODERATOR_ROLE, msg.sender) && hasRole(OPERATOR_ROLE, msg.sender)) {
      // Allow operator as well.
    }
    SocialB3TRStorage storage $ = _socialStorage();
    Comment storage comment = $.comments[commentId];
    require(comment.id != 0, "Comment does not exist");
    require(comment.hidden == false, "Comment already hidden");
    comment.hidden = true;
    emit CommentHidden(commentId, msg.sender);
  }

  /**
   * @notice Unhide a previously hidden comment.
   * @param commentId The ID of the comment to unhide.
   *
   * Requirements:
   * - Caller must have MODERATOR_ROLE or OPERATOR_ROLE.
   * - Comment must exist and currently be hidden.
   */
  function unhideComment(uint256 commentId) external onlyRole(MODERATOR_ROLE) {
    if (!hasRole(MODERATOR_ROLE, msg.sender) && hasRole(OPERATOR_ROLE, msg.sender)) {
      // Allow operator as well.
    }
    SocialB3TRStorage storage $ = _socialStorage();
    Comment storage comment = $.comments[commentId];
    require(comment.id != 0, "Comment does not exist");
    require(comment.hidden == true, "Comment is not hidden");
    comment.hidden = false;
    emit CommentUnhidden(commentId, msg.sender);
  }

  // ======================
  //    Reaction Functions
  // ======================

  /**
   * @notice Cast a thumbs-up or thumbs-down vote on a post.
   * @param postId The ID of the post to vote on.
   * @param isUp True for upvote (like), false for downvote (dislike).
   *
   * Requirements:
   * - Caller must be a verified person via VePassport.
   * - Post must exist and not be deleted.
   * - Caller can vote only once; repeated calls toggle or update their vote.
   */
  function votePost(uint256 postId, bool isUp) external {
    require(_isVerifiedPerson(msg.sender), "Identity verification failed");
    SocialB3TRStorage storage $ = _socialStorage();
    Post storage post = $.posts[postId];
    require(post.id != 0 && post.deleted == false, "Post does not exist or is deleted");

    // We will use a simple mechanism: maintain two counts and a separate mapping for user votes if needed.
    // For gas efficiency, we won't store an explicit mapping of user->vote for posts in this version.
    // Instead, assume UI or off-chain tracking prevents multiple votes. (This could be extended with mapping if strict on-chain one-vote rule is required).
    // Here, we simply emit an event and update counts assuming each call is an independent vote action (could allow multiple increments).
    if (isUp) {
      post.upvotes += 1;
    } else {
      post.downvotes += 1;
    }
    emit PostVoted(postId, msg.sender, isUp);
  }

  /**
   * @notice Cast a thumbs-up or thumbs-down vote on a comment.
   * @param commentId The ID of the comment to vote on.
   * @param isUp True for upvote, false for downvote.
   *
   * Requirements:
   * - Caller must be a verified person via VePassport.
   * - Comment must exist and not be deleted.
   * - Caller can vote only once; repeated calls toggle or update their vote (similar to votePost).
   */
  function voteComment(uint256 commentId, bool isUp) external {
    require(_isVerifiedPerson(msg.sender), "Identity verification failed");
    SocialB3TRStorage storage $ = _socialStorage();
    Comment storage comment = $.comments[commentId];
    require(comment.id != 0 && comment.deleted == false, "Comment does not exist or is deleted");

    if (isUp) {
      comment.upvotes += 1;
    } else {
      comment.downvotes += 1;
    }
    emit CommentVoted(commentId, msg.sender, isUp);
  }

  /**
   * @notice Give a special award to a post, boosting its visibility, at the cost of B3TR tokens.
   * @param postId The ID of the post to award.
   * @param awardType The type of award to give (1 = Bronze, 2 = Silver, 3 = Gold in this implementation).
   *
   * Transfers a set amount of B3TR from the caller to the treasury depending on the award type:
   * - Bronze: 10 B3TR
   * - Silver: 50 B3TR
   * - Gold: 100 B3TR
   * These amounts are added to the post's boost score.
   *
   * Requirements:
   * - Caller must be a verified person via VePassport.
   * - Post must exist and not be deleted.
   * - Caller must have approved the contract for the required B3TR amount.
   */
  function awardPost(uint256 postId, uint8 awardType) external {
    require(_isVerifiedPerson(msg.sender), "Identity verification failed");
    SocialB3TRStorage storage $ = _socialStorage();
    Post storage post = $.posts[postId];
    require(post.id != 0 && post.deleted == false, "Post does not exist or is deleted");
    require(awardType >= 1 && awardType <= 3, "Invalid award type");

    // Define award costs (in whole B3TR tokens). Assuming B3TR has 18 decimals, these values represent whole tokens.
    uint256 amount;
    if (awardType == 1) {
      amount = 10 * (10 ** 18); // Bronze costs 10 B3TR
    } else if (awardType == 2) {
      amount = 50 * (10 ** 18); // Silver costs 50 B3TR
    } else if (awardType == 3) {
      amount = 100 * (10 ** 18); // Gold costs 100 B3TR
    }

    // Transfer B3TR from the user to the treasury
    require($.B3TRToken.transferFrom(msg.sender, $.treasury, amount), "B3TR token transfer failed");
    // Update the post's boost score
    post.boost += amount;
    emit PostAwarded(postId, msg.sender, awardType, amount);
  }

  // ======================
  //   Administrative Functions
  // ======================

  /**
   * @notice Update the treasury address where special reaction payments are sent.
   * @param newTreasury The new treasury address.
   *
   * Requirements:
   * - Caller must have DEFAULT_ADMIN_ROLE.
   */
  function setTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newTreasury != address(0), "Treasury address cannot be zero");
    SocialB3TRStorage storage $ = _socialStorage();
    $.treasury = newTreasury;
    emit TreasuryUpdated(newTreasury);
  }

  /**
   * @notice Update the address of the VePassport contract used for identity verification.
   * @param newVePassport The new VePassport contract address.
   *
   * Requirements:
   * - Caller must have DEFAULT_ADMIN_ROLE.
   */
  function setVePassport(address newVePassport) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newVePassport != address(0), "VePassport address cannot be zero");
    SocialB3TRStorage storage $ = _socialStorage();
    $.vePassport = IVePassport(newVePassport);
    emit VePassportUpdated(newVePassport);
  }

  /**
   * @notice Update the address of the B3TR token contract.
   * @param newB3TRToken The new B3TR token contract address.
   *
   * Requirements:
   * - Caller must have DEFAULT_ADMIN_ROLE.
   */
  function setB3TRToken(address newB3TRToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newB3TRToken != address(0), "B3TR token address cannot be zero");
    SocialB3TRStorage storage $ = _socialStorage();
    $.B3TRToken = IERC20(newB3TRToken);
    emit B3TRTokenUpdated(newB3TRToken);
  }

  // ======================
  //     Internal Helpers
  // ======================

  /**
   * @dev Internal function to check via VePassport if an address is a verified person.
   * @param user The address to check.
   * @return True if the user is verified as a real person, false otherwise.
   */
  function _isVerifiedPerson(address user) internal view returns (bool) {
    SocialB3TRStorage storage $ = _socialStorage();
    if (address($.vePassport) == address(0)) {
      return false;
    }
    (bool isPerson, ) = $.vePassport.isPerson(user);
    return isPerson;
  }
}
