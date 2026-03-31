from sklearn.pipeline import Pipeline
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.model_selection import cross_val_score
import pickle
import os
import numpy as np
from imports import models

CLF_PATH = "weights/clf.pkl"

class RobertaEmbedder(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None):
        return self
    
    def transform(self, X):
        if isinstance(X, dict):
            texts = [v["text"] if isinstance(v, dict) else v for v in X.values()]
        elif isinstance(X, str):
            texts = [X]
        else:
            texts = list(X)
        return np.array([models.get_embedding_single(t) for t in texts])

def _build_pipeline(clf):
    return Pipeline([
        ("embedder", RobertaEmbedder()),
        ("classifier", clf)
    ])

clf = None
pipe = None

if os.path.exists(CLF_PATH):
    with open(CLF_PATH, "rb") as f:
        clf = pickle.load(f)
    pipe = _build_pipeline(clf)
    print("Loaded clf and built pipeline")
else:
    print("ERROR: model not found!!!!")