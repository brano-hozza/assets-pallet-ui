# Metadata problem

While I was presenting my metadata implementation to my roommate I figured out that it make no sense

## Original idea

Main idea was that asset could have some structure like this:

```jsonc
{
    "owner": "0x223c12313c1...", // Owner of the asset
    "name": "Nice", // Name of the asset
    "meta": { // Asset metadata
        // Any key:value pair
    }
}
```

Owner of this asset can alter metadata with `update_meta(hash: Hash, new_meta<Vec<u8>>)` transaction

## Problem

Problem is that if we take this and we want to use this in some game. Who will alter the metadata?

- User => It wouldn't make much sense because in that way user could change the attributes and be "overpowered"
- Game owner => We would be stuck in single game

## Possible solution???

I was thinking that it would be possible change structure like this:

```jsonc
{
    "owner": "0x223c12313c1...", // Owner of the asset
    "name": "Nice", // Name of the asset
    "data": { // Metadata for each game
        "personal":{ // Personal metadata shared between platforms but modifiable only by owner
            ... // Any key:value pair
        },
        "shared":{ // shared between platforms modifiable by admins and owner
            ... // Any key:value pair
        },
        "0x121cb12a12...": { // Game administrator address
            ... // Any key:value pair
        },
        ... // Other admins
    }
}
```

And then method for updating the meta would be `update_meta(hash: Hash, new_meta<Vec<u8>>, shared<Option<bool>>)` and we would check if hash is owner. If it isn't, then we would check if this administrator is registered in data object and then change the meta. To register administrator we first need to call `add_admin(hash: Hash, address: AccountId)` by the asset owner.

With this approach we could give game developers ability to specify their attributes or use some of this attributes from other games.
