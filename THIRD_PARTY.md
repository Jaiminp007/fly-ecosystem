# Third-party sources

`vendor/stonkfly/neural` is copied from nftechie/stonkfly commit
`78ef3e05ab0fa086032098558d893667068944a0` under its MIT license, retained at
`vendor/stonkfly/LICENSE`. It is used only by the separate full-connectome assay.
The trading broker, credentials and trading loop are not included.

MaleCNS v1.0 is downloaded separately from https://male-cns.janelia.org/download/
under the upstream CC-BY terms. Source checksums are pinned in the vendor directory.
The artificial genome and compact ecosystem are our implementation and are not
an official MaleCNS or biologically validated model.

The compact ecosystem has no third-party JavaScript runtime dependencies.
The optional full-connectome assay requires NumPy, pandas, PyArrow and a C++17
compiler. Their licenses remain with their distributions.
