import { BigInt, Address, TypedMap, TypedMapEntry } from "@graphprotocol/graph-ts"

import {
  Contribute,
  IncreaseReward
} from "../generated/NotAPyramidScheme/NotAPyramidScheme";
import { Node, Sender } from "../generated/schema";

export function handleContribute(event: Contribute) : void{
  const senderString: string = event.params.contributor.toHexString();
  let sender = Sender.load(senderString);
  const donationAmount = event.params.donationSize
  const parentAddress = event.params.parent;

  if (sender == null) {
    sender = new Sender(senderString);
    sender.address = event.params.contributor;
    sender.createdAt = event.block.timestamp;


  }

  let node: Node = new Node(sender.id);

  node.donationAmount = donationAmount;
  node.parentNodeAddress = parentAddress;
  node.cumualativeDonationAmount = BigInt.fromI32(0);
  node.unclaimedRewardAmount = BigInt.fromI32(0);
  node.totalRewardAmount = BigInt.fromI32(0);
  
  sender.save();
  node.save();
  
}

export function handleIncreaseReward(event: IncreaseReward) :void{
  const nodeString: string = event.params.nodeAddress.toHexString();
  let node = Node.load(nodeString);

  if  (node == null) {
    node = new Node(nodeString);  
  }
  node.unclaimedRewardAmount = node.unclaimedRewardAmount.plus(event.params.donationSize);
  node.totalRewardAmount = node.totalRewardAmount.plus(event.params.donationSize);
  // const rewardAmount = event.params.rewardAmount

  // do some stuff
  // load the node probably and increase the rewards
  node.save()
}