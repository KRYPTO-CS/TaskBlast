import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, auth } from "./firebase";
import * as ImagePicker from "expo-image-picker";

/**
 * Request permissions for accessing the image library
 */
export const requestImagePermissions = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    alert("Sorry, we need camera roll permissions to upload a profile picture!");
    return false;
  }
  return true;
};

/**
 * Pick an image from the device's library
 */
export const pickImage = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestImagePermissions();
    if (!hasPermission) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error("Error picking image:", error);
    alert("Failed to pick image. Please try again.");
    return null;
  }
};

/**
 * Upload profile picture to Firebase Storage
 * @param imageUri - The local URI of the image
 * @param userId - The user's Firebase Auth UID
 * @returns The download URL of the uploaded image
 */
export const uploadProfilePicture = async (
  imageUri: string,
  userId: string
): Promise<string> => {
  try {
    // Fetch the image as a blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create a reference to the storage location
    const filename = `profile_${Date.now()}.jpg`;
    const storageRef = ref(storage, `profilePictures/${userId}/${filename}`);

    // Upload the image
    await uploadBytes(storageRef, blob);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    throw new Error("Failed to upload profile picture. Please try again.");
  }
};

/**
 * Delete a profile picture from Firebase Storage
 * @param imageUrl - The full download URL of the image to delete
 */
export const deleteProfilePicture = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the download URL
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch || !pathMatch[1]) {
      throw new Error("Invalid image URL");
    }

    const imagePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, imagePath);

    await deleteObject(imageRef);
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    throw new Error("Failed to delete profile picture.");
  }
};

/**
 * Update user's profile picture
 * Handles picking, uploading, and replacing the old picture
 * @param currentImageUrl - The current profile picture URL (optional)
 * @returns The new profile picture URL or null if cancelled
 */
export const updateProfilePicture = async (
  currentImageUrl?: string
): Promise<string | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("No authenticated user found");
    }

    // Pick a new image
    const imageUri = await pickImage();
    if (!imageUri) return null;

    // Upload the new image
    const newImageUrl = await uploadProfilePicture(imageUri, currentUser.uid);

    // Delete the old image if it exists and is from Firebase Storage
    if (currentImageUrl && currentImageUrl.includes("firebase")) {
      try {
        await deleteProfilePicture(currentImageUrl);
      } catch (error) {
        console.warn("Could not delete old profile picture:", error);
        // Continue anyway since the new image was uploaded successfully
      }
    }

    return newImageUrl;
  } catch (error) {
    console.error("Error updating profile picture:", error);
    alert("Failed to update profile picture. Please try again.");
    return null;
  }
};
