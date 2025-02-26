var merge = function(nums1, m, nums2, n) {
    let x = m - 1; // Last valid element in nums1
    let j = n - 1; // Last element in nums2
    let k = m + n - 1; // Last index of nums1
 
    for (let i = k; i >= 0; i--) { // Iterate backwards

        if (x >= 0 && j >= 0) {
         
            
            if (nums1[x] > nums2[j]) {
                nums1[i] = nums1[x];
                x--; 
                
            } else {

                nums1[i] = nums2[j];
                j--; 
                
            }

        } else if (j >= 0) { 
            nums1[i] = nums2[j];
            j--;
        }
    }
};