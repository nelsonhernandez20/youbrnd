"use server";

import { db } from "@/lib/db";
import { deleteFile, uploadFile } from "./uploadFile";
import { currentUser } from "@clerk/nextjs";

export const createUser = async (user) => {
  const { id, first_name, last_name, email_address, image_url, username } =
    user;
  try {
    const userExists = await db.user.findUnique({
      where: {
        id,
      },
    });
    if (userExists) {
      updateUser(user);
      return;
    }
    await db.user.create({
      data: {
        id,
        first_name,
        last_name,
        email_address,
        image_url,
        username,
      },
    });
    console.log("New user created in db");
  } catch (e) {
    console.log(e);
    return {
      error: "Failed to save new user in db",
    };
  }

  console.log("User created in supabase");
};

export const updateUser = async (user) => {
  const { id, first_name, last_name, email_address, image_url, username } =
    user;
  try {
    await db.user.update({
      where: {
        id,
      },
      data: {
        first_name,
        last_name,
        email_address,
        image_url,
        username,
      },
    });
  } catch (e) {
    console.log(e);
    return {
      error: "Failed to update user in db",
    };
  }

  console.log("User updated in supabase");
};

export const getUser = async (id) => {
  try {
    const user = await db.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email_address: true,
        image_url: true,
        username: true,
        banner_url: true,
        banner_id: true,
        bio: true,
        isInfluencer: true,
        tags: true,
      },
    });
    return { data: user };
  } catch (e) {
    throw e;
  }
};

export const deleteUser = async (id) => {
  try {
    await db.user.delete({
      where: {
        id,
      },
    });
  } catch (e) {
    console.log(e);
    return {
      error: "Failed to delete user in db",
    };
  }

  console.log("User deleted in supabase");
};

export const updateBanner = async (params) => {
  const { id, banner, prevBannerId } = params;
  try {
    let banner_id;
    let banner_url;

    if (banner) {
      const res = await uploadFile(banner, `/users/${id}`);
      const { public_id, secure_url } = res;
      banner_id = public_id;
      banner_url = secure_url;

      // Delete previous banner
      if (prevBannerId) {
        await deleteFile(prevBannerId);
      }
    }
    await db.user.update({
      where: {
        id,
      },
      data: {
        banner_url,
        banner_id,
      },
    });
    console.log("user banner updated");
  } catch (e) {
    console.log("Error updating user banner");
    throw e;
  }
};

export const updateFollow = async (params) => {
  const { id, type } = params;
  // type = follow or unfollow, id is target user id
  try {
    const loggedInUser = await currentUser();
    if (type === "follow") {
      await db.follow.create({
        data: {
          follower: {
            connect: {
              id: loggedInUser.id,
            },
          },
          following: {
            connect: {
              id,
            },
          },
        },
      });
      console.log("User followed");
    } else if (type === "unfollow") {
      await db.follow.deleteMany({
        where: {
          followerId: loggedInUser.id,
          followingId: id,
        },
      });
      console.log("User unfollowed");
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const getAllFollowersAndFollowings = async (id) => {
  try {
    const followers = await db.follow.findMany({
      where: {
        followingId: id,
      },
      include: {
        follower: true,
      },
    });
    const following = await db.follow.findMany({
      where: {
        followerId: id,
      },
      include: {
        following: true,
      },
    });
    return {
      followers,
      following,
    };
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const getFollowSuggestions = async () => {
  try {
    const loggedInUser = await currentUser();
    // Fetch all users that the given user is already following
    const following = await db.follow.findMany({
      where: {
        followerId: loggedInUser?.id,
      },
    });

    // Extract the IDs of the users that the given user is already following
    const followingIds = following.map((follow) => follow.followingId);

    // Fetch all users that the given user is not already following
    const suggestions = await db.user.findMany({
      where: {
        AND: [
          { id: { not: loggedInUser?.id } }, // Exclude the user themselves
          { id: { notIn: followingIds } }, // Exclude users they're already following
        ],
      },
    });

    return suggestions;
  } catch (e) {
    console.log(e);
    throw e;
  }
};

export const updateBio = async (params) => {
  const { id, bio } = params;
  try {
    await db.user.update({
      where: {
        id,
      },
      data: {
        bio,
      },
    });
    console.log("user bio updated");
  } catch (e) {
    console.log("Error updating user bio");
    throw e;
  }
};

export const updateInfluencerStatus = async (params) => {
  const { id, isInfluencer } = params;
  try {
    await db.user.update({
      where: {
        id,
      },
      data: {
        isInfluencer,
      },
    });
    console.log("user influencer status updated");
  } catch (e) {
    console.log("Error updating user influencer status");
    throw e;
  }
};

export const searchUsers = async ({ query, type = "all" }) => {
  try {
    const where = {
      OR: [
        { first_name: { contains: query, mode: "insensitive" } },
        { last_name: { contains: query, mode: "insensitive" } },
        { email_address: { contains: query, mode: "insensitive" } },
        { username: { contains: query, mode: "insensitive" } },
        { bio: { contains: query, mode: "insensitive" } },
        { tags: { has: query } }
      ]
    };

    // Agregar filtro por tipo si no es "all"
    if (type === "influencer") {
      where.isInfluencer = true;
    } else if (type === "company") {
      where.isInfluencer = false;
    }

    const users = await db.user.findMany({
      where,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email_address: true,
        image_url: true,
        username: true,
        bio: true,
        isInfluencer: true,
        tags: true,
      },
      take: 10,
    });

    return { data: users };
  } catch (error) {
    console.error("Error searching users:", error);
    throw error;
  }
};
