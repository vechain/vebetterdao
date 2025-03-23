# SocialB3TR.sol Self-Contained Upgradeable Contract

## Overview

The SocialB3TR smart contract is an upgradeable social platform contract that allows verified users to create posts and comments, react to content, and give special awards using the B3TR token. It is designed to be deployed behind a UUPS proxy for future upgradeability [as described in OpenZeppelin documentation](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable). The contract uses role-based access control for administrative actions and integrates with VePassport to ensure only real human users (no bots) can post or react [according to VeBetterDAO documentation](https://docs.vebetterdao.org). All core state is stored in an unstructured storage slot (using a keccak256 namespace) to maintain a stable layout across upgrades, following [best practices for upgradeable contracts](https://ethereum-magicians.org).

## Roles and Access Control

We leverage OpenZeppelin's AccessControlUpgradeable to manage roles and permissions. This allows defining multiple roles with different privileges instead of a single owner [as described in OpenZeppelin documentation](https://docs.openzeppelin.com/contracts/4.x/access-control). The contract defines four roles:

- **DEFAULT_ADMIN_ROLE**: Full authority to manage other roles and critical settings.
- **UPGRADER_ROLE**: Permission to upgrade the contract's implementation (via UUPS proxy).
- **OPERATOR_ROLE**: Operational authority for future extensions (e.g., platform management tasks).
- **MODERATOR_ROLE**: Power to moderate content (hide or unhide posts/comments).

Roles are represented by bytes32 identifiers (using the keccak256 hash of a role name) [as described in OpenZeppelin documentation](https://docs.openzeppelin.com/contracts/4.x/access-control#role-based-access-control). The default admin (usually the deployer or a multi-sig) can grant or revoke any role.

In the initialize function, we grant the initial roles to specified addresses. By default, the deployer is given all roles (admin, upgrader, operator, moderator) unless separate addresses are provided for each. This ensures the contract functions out-of-the-box, and privileges can later be delegated as needed. All functions that require a specific role use OpenZeppelin's onlyRole modifier to restrict access. For example, the \_authorizeUpgrade function (required by UUPS) is protected so that only an address with UPGRADER_ROLE can upgrade the contract.

## Upgradeability (UUPS Proxy Pattern)

The contract supports UUPS (Universal Upgradeable Proxy Standard, ERC-1822) for upgradeability. It inherits OpenZeppelin's UUPSUpgradeable module, which provides the internal \_authorizeUpgrade hook [as described in OpenZeppelin documentation](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable). We override this function to restrict upgrades to authorized accounts (those with the UPGRADER_ROLE) [as recommended by OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable-_authorizeUpgrade-address-).

This pattern places the upgrade logic in the implementation contract itself rather than using a separate admin proxy, making it more lightweight and flexible [as described in OpenZeppelin documentation](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable). The contract's constructor calls \_disableInitializers() to prevent anyone from initializing the logic contract directly, as recommended for upgradeable contracts. Upgrades can be performed via the proxy by calling upgradeTo on the implementation (usually through a framework like OpenZeppelin Upgrades Plugins), and \_authorizeUpgrade will ensure security.

## Identity Verification with VePassport

To maintain Sybil resistance and ensure only real users interact, SocialB3TR integrates with VePassport. VePassport is a system on VeChain that can determine if a wallet belongs to a real person or a bot [as described in VeBetterDAO documentation](https://docs.vebetterdao.org).

The contract stores an instance of the VePassport interface and, before allowing any user-generated action (like creating a post, commenting, or reacting), it calls vePassport.isPerson(msg.sender). This function returns true if the user is verified human [according to VeBetterDAO documentation](https://docs.vebetterdao.org). If the check fails, the action is rejected. This means bots or unverified addresses cannot create content or cast votes, helping to prevent spam and Sybil attacks.

The VePassport contract address is set during initialization and can be updated by the admin if needed (for example, if the VePassport system's address changes), ensuring flexibility.

## Content: Posts and Comments

### Posts

Verified users can create posts by calling createPost(text, uri). Each post stores the author's address, on-chain text content, an optional media or IPFS URI, a timestamp, reaction counts, a boost score, and status flags. The content text is stored on-chain (allowing quick reads on-chain), and an optional uri can link to off-chain content or media (such as an IPFS CID for larger data or images).

The contract assigns a unique post ID (incremented sequentially) to each new post and emits a PostCreated event. Users can later update their post's text or URI with updatePost (if they are the author and the post is not deleted), which emits PostUpdated. They may also delete their post using deletePost—this flags the post as deleted (and we can optionally clear its content to save storage). Deleted posts won't appear in queries and cannot be edited or reacted to further.

### Comments

Similarly, users can comment on a post using createComment(postId, text, uri). Comments are stored with a unique comment ID, a reference to the parent post, the author, the content text, optional URI, timestamp, and reaction counts. A comment can be updated or deleted by its author via updateComment and deleteComment respectively.

The contract ensures that you cannot comment on a nonexistent or deleted post. Each of these actions (create, update, delete) emits corresponding events (CommentCreated, CommentUpdated, CommentDeleted) for off-chain indexing.

Both posts and comments include a hidden flag and a deleted flag. The deleted flag indicates removal by the author (content is no longer active). The hidden flag is managed by moderators as described next.

## Moderation (Hide/Unhide Content)

To maintain community standards, addresses with the MODERATOR_ROLE (or OPERATOR_ROLE) can hide or unhide content. Hiding a post or comment (via hidePost or hideComment) will set its hidden flag to true, which signals the front-end or other consumers to not display this content (or to mark it as moderated).

Hidden content is still stored on-chain (for transparency and potential appeals) but effectively removed from public view. Only a moderator (or an operator) can hide content, and likewise only they can unhide it (unhidePost/unhideComment), which resets the flag.

These actions emit events (PostHidden, PostUnhidden, CommentHidden, CommentUnhidden) to enable tracking moderation events off-chain. Notably, hiding is different from deleting: authors cannot hide their content (they would delete it if they choose), and moderators cannot delete content (only hide), preserving a record of the original post/comment on-chain.

## Reactions: Thumbs Up/Down and Special Awards

### Voting (Thumbs Up/Down)

Users can react to posts and comments with a thumbs-up (like) or thumbs-down (dislike). This is analogous to upvotes/downvotes on platforms like Reddit. Each verified user can vote on a given post or comment, and their vote is counted at most once.

The contract tracks the total upvote and downvote counts for each post/comment, as well as each user's voting state to prevent multiple votes or flipping without an explicit action. Calling votePost(postId, up) (with up=true for thumbs-up or false for thumbs-down) will record the vote. If the user already voted the opposite direction on that content, the contract can adjust the counts (for example, removing their previous downvote and adding an upvote).

Similarly, voteComment(commentId, up) handles comment votes. Voting emits a PostVoted or CommentVoted event with the voter and the new vote value. These votes are free to cast (no token cost) but restricted to real users via VePassport. The total score or rating of a post/comment can be derived from the difference between up and down counts, or both counts individually as stored.

### Special Reactions (Awards)

The contract supports special award reactions, inspired by Reddit Gold and similar features, which involve spending the platform's token (B3TR) to reward content and boost its visibility.

A user may call awardPost(postId, reactionType) to give a paid award to a post. Each award type costs a certain amount of B3TR tokens. For example, we could define awards like Bronze, Silver, Gold with increasing costs. In this contract, for demonstration, we define three award tiers:

- Bronze Award: costs 10 B3TR tokens.
- Silver Award: costs 50 B3TR tokens.
- Gold Award: costs 100 B3TR tokens.

When a user gives an award, the specified cost in B3TR must be paid from the user's wallet to the contract (which immediately forwards it to the treasury). This requires the user to have approved the SocialB3TR contract to spend their B3TR tokens beforehand.

Upon awarding, the post's boost score is increased by the cost amount. The boost score is a metric that accumulates all B3TR spent on the post via awards — it can be used by the front-end or algorithms to highlight or rank posts (posts with more B3TR spent on them might be featured or sorted higher, similar to how Reddit might highlight gilded posts).

All award payments are routed directly to a designated treasury address, which could be the project's treasury or rewards pool. We emit a PostAwarded event indicating which post received an award, who gave it, and which type (or how much was spent). This special reaction system not only engages users but also creates a token flow to the treasury (for example, to fund development or community rewards).

Note: In this implementation, special awards are defined with fixed costs and only apply to posts (boosting their visibility). The system can be extended to allow awards on comments or to add more award types; these would similarly transfer B3TR to the treasury and could be tracked for different purposes.

## Treasury and Administrative Settings

The treasury address is where all B3TR token payments from awards are sent. It is set during the contract initialization and can only be changed by an account with the DEFAULT_ADMIN_ROLE. This ensures that only a trusted admin can redirect where funds flow. For example, the admin might update the treasury to a new multisig wallet if needed. The contract provides setTreasury(address) for this, protected by the admin role.

We also store references to the B3TR token contract (as B3TRToken) and the VePassport contract in the state, which the admin can update via setB3TRToken and setVePassport if those external contracts change addresses (upgrade or switch in the ecosystem).

## Storage Layout and Upgrade Safety

All state variables of the contract are encapsulated in a single struct SocialB3TRStorage defined in an unstructured storage slot. We use a constant storage slot identifier derived from a hash, bytes32(keccak256("vebetter.socialb3tr.storage")), to serve as the pointer to our struct in storage.

This pattern (often called namespaced storage) isolates our contract's state from any inherited contract's state and makes it easier to append new variables in future upgrades without risking storage collisions [as discussed on Ethereum Magicians](https://ethereum-magicians.org).

OpenZeppelin has adopted a similar approach (see their use of @custom:storage-location with hashed labels for upgradeable contracts). By storing everything under one custom slot, we ensure that the upgradeable proxy's storage (which typically starts at slot 0 for user-defined variables) is not inadvertently overwritten by our logic or vice versa [as described in OpenZeppelin documentation](https://docs.openzeppelin.com/contracts/4.x/upgradeable).

The struct includes mappings for posts and comments, counters for the next IDs, and all other necessary data. This design must be maintained in any future versions of the contract — the storage slot constant remains the same, and new state variables would be added to the struct (not as new separate state variables) to keep the layout consistent.
