import React from "react";
import { View, Text } from "react-native";

import { Benicorn } from '../../Guides/Benicorn';
import { useExperts } from '../../../contexts/expertsContext';
import { useNetwork } from '../../../contexts/networkContext';
import styles from './styles';

const ExpertStage = () => {
  const { expertsOn, actionMode, dialog } = useExperts();
  const { isPolygon } = useNetwork();

  return (
    <View style={styles.container}>
      <View style={styles.expertCardWrapper}>
        <View style={styles.textWrapper}>
          <Text>Expert Stage Component</Text>
        </View>
        <View style={styles.iconWrapper}>
          <Benicorn style={styles.icon} />
        </View>
      </View>

    </View>
  );
};

export default ExpertStage;

// export const ExpertStage = () => {
//   const { expertsOn, actionMode, dialog } = useExperts();
//   const Icon = Icons[actionMode];
//   const { isPolygon } = useNetwork();

//   if (expertsOn === true || !isPolygon) {
//     return (
//       <Box sx={{ alignSelf: 'center', px: 2 }}>
//         <Stack
//           direction="row"
//           spacing={1}
//           sx={{
//             borderColor: 'white',
//             borderWidth: 2,
//             borderRadius: 5,
//             m: 2.5,
//             p: 2.5,
//             width: 400,
//             boxShadow: 'var(--boxShadow)',
//             backgroundImage: 'var(--bg)',
//           }}
//         >
//           <Box sx={{ display: 'flex', flex: 1, alignSelf: 'center', p: 1.5 }}>
//             <Text style={{ wordBreak: 'break-word' }}>{dialog}</Text>
//           </Box>
//           <Box sx={{ display: 'flex', flex: 1, alignSelf: 'center', px: 2 }}>
//             {Icon && <Icon />}
//           </Box>
//         </Stack>
//         <br />
//       </Box>
//     );
//   } else {
//     return null;
//   }
// };
