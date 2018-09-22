module Update exposing (update)

-- import Dom

import Browser
import Browser.Navigation as Nav
import Debug
import Dict
import Material
import Model exposing (Model)
import Msg exposing (Msg(..))
import Rest exposing (..)
import Route exposing (Route)
import Task
import Types exposing (..)
import Url


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            ( model, Cmd.none )

        Mdc msg_ ->
            Material.update Mdc msg_ model

        LinkClicked urlRequest ->
            case urlRequest of
                Browser.Internal url ->
                    ( model, Nav.pushUrl model.key (Url.toString url) )

                Browser.External href ->
                    ( model, Nav.load href )

        UrlChanged url ->
            -- FIXME do we want to keep the Url in the model?
            -- ( { model | url = url }, Cmd.none )
            (model, Cmd.none)

        NavigateTo location ->
            location
                |> Route.locFor
                |> urlUpdate model

        NewUrl route focus ->
            let
                focusCmd =
                    case focus of
                        Just id ->
                            -- FIXME Task.attempt (\_ -> NoOp) <| Dom.focus id
                            Cmd.none

                        Nothing ->
                            Cmd.none
            in
            ({ model | history = Just route :: model.history }, Cmd.batch[ Nav.pushUrl model.key (Route.urlFor route), focusCmd ])

        FocusInput id ->
            ( model
            , -- FIXME Task.attempt (\_ -> NoOp) <| Dom.focus id
              Cmd.none
            )

        FetchLookupWord query ->
            (model, fetchLookupWord query)

        SetDictLookupQuery query ->
            let
                s =
                    model.dictionarySearchState

                s_ =
                    { s | lookupQuery = query }
            in
            ({ model | dictionarySearchState = s_ }, fetchDictWord query)

        SetTextLookupQuery query ->
            let
                s =
                    model.textSearchState

                s_ =
                    { s | lookupQuery = query }
            in
            ({ model | textSearchState = s_ }, fetchTextQuery query)

        LookupWordDataReceived data ->
            let
                s =
                    model.lookupState

                s_ =
                    { s | currentWord = data }
            in
            ({ model | lookupState = s_ }, Cmd.none)

        DictLookupDataReceived data ->
            let
                s =
                    model.dictionarySearchState

                s_ =
                    { s | lookupResults = data }
            in
            ({ model | dictionarySearchState = s_ }, Cmd.none)

        TextQueryDataReceived data ->
            let
                s =
                    model.textSearchState

                s_ =
                    { s | lookupResults = data }
            in
            ({ model | textSearchState = s_ }, Cmd.none)

        AddToSelectedResults dictWord ->
            let
                s =
                    model.dictionarySearchState

                s_ =
                    let
                        wordList =
                            List.filter (\x -> not (x.word == dictWord.word)) s.selectedWordsList
                    in
                    { s | selectedWordsList = dictWord :: wordList }
            in
            ({ model | dictionarySearchState = s_ }, Cmd.none)

        RemoveFromSelectedResults dictWord ->
            let
                s =
                    model.dictionarySearchState

                s_ =
                    let
                        wordList =
                            List.filter (\x -> not (x.word == dictWord.word)) s.selectedWordsList
                    in
                    { s | selectedWordsList = wordList }
            in
            ({ model | dictionarySearchState = s_ }, Cmd.none)

        AddToSelectedTexts selectedText ->
            let
                t_uid =
                    getUid selectedText

                s =
                    model.textSearchState

                s_ =
                    { s | selectedText = Just selectedText }

                s__ =
                    let
                        textList =
                            List.filter (\x -> not (getUid x == t_uid)) s_.selectedTextList
                    in
                    { s_ | selectedTextList = selectedText :: textList }
            in
            ({ model | textSearchState = s__ }, Cmd.none)

        SetSelectedReadText t ->
            let
                s =
                    model.textReadState

                s_ =
                    { s | selectedText = Just t }

                route =
                    Just Route.ReadText
            in
            ({ model | textReadState = s_, history = route :: model.history }, Cmd.none)

        AddToDictInput letter ->
            let
                s =
                    model.dictionarySearchState

                s_ =
                    { s | lookupQuery = s.lookupQuery ++ letter }
            in
            ( { model | dictionarySearchState = s_ }
            , Cmd.batch
                [ fetchDictWord s_.lookupQuery
                , -- FIXME Task.attempt (\_ -> NoOp) <| Dom.focus "query-input"
                  Cmd.none
                ]
            )


getUid t =
    case t of
        SelectedRootText t_ ->
            t_.uid

        SelectedTranslatedText t_ ->
            t_.uid


urlUpdate : Model -> Maybe Route -> ( Model, Cmd Msg )
urlUpdate model route =
    ({ model | history = route :: model.history }, Cmd.none)
