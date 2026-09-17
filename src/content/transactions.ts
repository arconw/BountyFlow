export const transactionCopy = {
  create: {
    confirm: "create_this_bounty",
    description: "the_reward_will_be_held_in_escrow_until_the_work_is_complete",
    success: "bounty_created",
    successDescription: "your_bounty_is_ready_for_its_next_contributor",
    button: "create_bounty",
  },
  accept: {
    confirm: "accept_this_bounty",
    description:
      "you_ll_be_registered_as_the_contributor_for_this_bounty_submit_your_work_for_the_creator_to_review",
    success: "bounty_accepted",
    successDescription:
      "you_re_assigned_to_this_bounty_time_to_build_something_good",
    button: "accept_bounty",
  },
  release: {
    confirm: "release_bounty_reward",
    description:
      "the_reward_will_be_transferred_to_the_contributor_an_on_chain_payment_cannot_be_undone",
    success: "payment_released",
    successDescription:
      "the_reward_has_been_sent_to_the_contributor_good_work_rewarded",
    button: "release_reward",
  },
};
