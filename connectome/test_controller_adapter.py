import unittest

from connectome.controller_adapter import controller_view


class ControllerAdapterTest(unittest.TestCase):
    def test_view_preserves_model_specific_readouts_and_noninheritance(self):
        view = controller_view({
            'id': 3, 'generation': 2, 'parents': [1, 2], 'age': 12.5, 'energy': 44,
            'alleles': {'visual_gain': 1.1},
            'neural': {'spikes': 9, 'active_neurons': 4, 'readout_hz': {'DNp09_L': 20},
                       'sensory_drive': {'LC9_L': 30}},
        }, {'neurons': 166700, 'edges': 25582938})
        self.assertEqual(view['model'], 'malecns-connectome')
        self.assertEqual(view['controller']['neurons'], 166700)
        self.assertIsNone(view['controller']['inputs'])
        self.assertFalse(view['controller']['topologyMutable'])
        self.assertFalse(view['controller']['acquiredMemoryInherited'])
        self.assertEqual(view['lastObservation']['spikes'], 9)


if __name__ == '__main__':
    unittest.main()
